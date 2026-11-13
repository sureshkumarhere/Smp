import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import ringtoneUrl from "../assets/tune.wav";
import socket from "../socket/socket";
import { ICE_SERVERS } from "../utils/webrtcConfig";

export const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const currentUser = useSelector((store) => store?.auth);

  // Call status: 'idle' | 'calling' | 'ringing' | 'connected'
  const [callStatus, setCallStatus] = useState("idle");
  // Call type: 'audio' | 'video'
  const [callType, setCallType] = useState("video");
  // Remote user info (display name, avatar, id)
  const [remoteUser, setRemoteUser] = useState(null);
  // Streams for media rendering
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // In-call control states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Incoming call metadata: { caller, offer, isVideo }
  const [incomingCallData, setIncomingCallData] = useState(null);

  // Internal refs to retain fresh instances and avoid stale closures
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const activePeerIdRef = useRef(null);

  // Keep refs in sync with state for access in socket callbacks
  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Ringtone playback controls
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio(ringtoneUrl);
        ringtoneAudioRef.current.loop = true;
      }
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch((err) => {
        console.warn("Ringtone autoplay prevented:", err);
      });
    } catch (e) {
      console.warn("Failed to play ringtone:", e);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
      }
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
    } catch (e) {
      console.warn("Failed to stop ringtone:", e);
    }
  }, []);

  // Duration timer helpers
  const startTimer = useCallback(() => {
    setCallDuration(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCallDuration(0);
  }, []);

  // Full connection cleanup helper
  const cleanUpCall = useCallback(() => {
    stopRingtone();
    stopTimer();

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Stop all remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    candidateQueueRef.current = [];
    originalVideoTrackRef.current = null;
    activePeerIdRef.current = null;

    setCallStatus("idle");
    setRemoteUser(null);
    setIncomingCallData(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, [stopRingtone, stopTimer]);

  // Setup PeerConnection with event handlers
  const createPeerConnection = useCallback(
    (targetUserId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && targetUserId) {
          socket.emit("call:ice-candidate", {
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
        } else {
          // Fallback if browser doesn't group into streams[0]
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
            setRemoteStream(remoteStreamRef.current);
          }
          remoteStreamRef.current.addTrack(event.track);
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          toast.info("Call disconnected");
          cleanUpCall();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [cleanUpCall]
  );

  // Helper to acquire local camera & microphone media
  const getMediaStream = useCallback(async (videoRequested) => {
    try {
      const constraints = {
        audio: true,
        video: videoRequested
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to acquire user media:", err);
      toast.error(
        err.name === "NotAllowedError"
          ? "Permission denied. Please allow microphone/camera access."
          : "Unable to access camera or microphone."
      );
      throw err;
    }
  }, []);

  // ============================================================
  // Call Actions: Initiate, Accept, Reject, End
  // ============================================================

  /**
   * Initiate an outgoing 1-on-1 call
   */
  const initiateCall = useCallback(
    async ({ receiver, isVideo = true }) => {
      if (!receiver?._id) {
        toast.error("Invalid recipient");
        return;
      }
      if (callStatusRef.current !== "idle") {
        toast.warn("You are already in an active call");
        return;
      }

      try {
        const stream = await getMediaStream(isVideo);
        const pc = createPeerConnection(receiver._id);
        activePeerIdRef.current = receiver._id;

        // Add local tracks to RTCPeerConnection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Create and set local SDP offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Update states
        setCallStatus("calling");
        setCallType(isVideo ? "video" : "audio");
        setRemoteUser(receiver);

        // Emit call invitation to server
        socket.emit("call:initiate", {
          receiverId: receiver._id,
          caller: currentUser,
          offer,
          isVideo: Boolean(isVideo),
        });

        // Auto cancel if receiver does not answer in 45 seconds
        ringTimeoutRef.current = setTimeout(() => {
          if (callStatusRef.current === "calling") {
            toast.info("No answer");
            socket.emit("call:end", { targetUserId: receiver._id });
            cleanUpCall();
          }
        }, 45000);
      } catch (err) {
        console.error("Failed to initiate call:", err);
        cleanUpCall();
      }
    },
    [currentUser, getMediaStream, createPeerConnection, cleanUpCall]
  );

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    const { caller, offer, isVideo } = incomingCallData;

    stopRingtone();

    try {
      const stream = await getMediaStream(isVideo);
      const pc = createPeerConnection(caller._id);
      activePeerIdRef.current = caller._id;

      // Add local media tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Set remote SDP description from caller offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Drain any queued ICE candidates received before remote description was ready
      while (candidateQueueRef.current.length > 0) {
        const candidate = candidateQueueRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }

      // Create and set SDP answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Notify caller through socket signaling
      socket.emit("call:accept", {
        callerId: caller._id,
        answer,
      });

      setCallStatus("connected");
      setCallType(isVideo ? "video" : "audio");
      setRemoteUser(caller);
      setIncomingCallData(null);
      startTimer();
    } catch (err) {
      console.error("Failed to accept call:", err);
      toast.error("Failed to connect call");
      cleanUpCall();
    }
  }, [incomingCallData, stopRingtone, getMediaStream, createPeerConnection, startTimer, cleanUpCall]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(
    (reason = "Call declined") => {
      stopRingtone();
      if (incomingCallData?.caller?._id) {
        socket.emit("call:reject", {
          callerId: incomingCallData.caller._id,
          reason,
        });
      }
      cleanUpCall();
    },
    [incomingCallData, stopRingtone, cleanUpCall]
  );

  /**
   * Hang up / end the current call
   */
  const endCall = useCallback(() => {
    const peerId = activePeerIdRef.current || remoteUser?._id || incomingCallData?.caller?._id;
    if (peerId) {
      socket.emit("call:end", { targetUserId: peerId });
    }
    cleanUpCall();
  }, [remoteUser, incomingCallData, cleanUpCall]);

  // ============================================================
  // In-Call Media Controls (Mute, Camera Toggle, Screen Sharing)
  // ============================================================

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];

        // Store original camera track to switch back later
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");

        if (videoSender) {
          originalVideoTrackRef.current = videoSender.track;
          await videoSender.replaceTrack(screenTrack);
        }

        // Auto revert when user stops sharing via native browser banner
        screenTrack.onended = async () => {
          if (videoSender && originalVideoTrackRef.current) {
            await videoSender.replaceTrack(originalVideoTrackRef.current);
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          console.error("Screen share error:", err);
          toast.error("Failed to share screen");
        }
      }
    } else {
      // Revert back to camera track
      try {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && originalVideoTrackRef.current) {
          await videoSender.replaceTrack(originalVideoTrackRef.current);
        }
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Error switching back from screen share:", err);
      }
    }
  }, [isScreenSharing]);

  // ============================================================
  // Socket Signaling Event Listeners
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming Call Event
    const handleIncomingCall = ({ caller, offer, isVideo }) => {
      // If already in a call, inform caller that we are busy
      if (callStatusRef.current !== "idle") {
        socket.emit("call:reject", {
          callerId: caller?._id,
          reason: "User is busy on another call",
        });
        return;
      }

      setIncomingCallData({ caller, offer, isVideo });
      setRemoteUser(caller);
      setCallType(isVideo ? "video" : "audio");
      setCallStatus("ringing");
      playRingtone();

      // Auto dismiss ringing after 30 seconds if unanswered
      ringTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === "ringing") {
          toast.info("Missed call");
          rejectCall("No answer");
        }
      }, 30000);
    };

    // 2. Call Accepted Event (Caller side)
    const handleCallAccepted = async ({ answer }) => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued ICE candidates
          while (candidateQueueRef.current.length > 0) {
            const candidate = candidateQueueRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding queued ICE candidate:", e);
            }
          }

          setCallStatus("connected");
          startTimer();
          toast.success("Call connected");
        } catch (err) {
          console.error("Error setting remote description on call accepted:", err);
          cleanUpCall();
        }
      }
    };

    // 3. ICE Candidate Exchange
    const handleIceCandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (!candidate) return;

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Failed to add received ICE candidate:", err);
        }
      } else {
        // Buffer until remote description is set
        candidateQueueRef.current.push(candidate);
      }
    };

    // 4. Call Rejected
    const handleCallRejected = ({ reason }) => {
      toast.info(reason || "Call was declined");
      cleanUpCall();
    };

    // 5. Call Unavailable (User offline)
    const handleCallUnavailable = ({ reason }) => {
      toast.warn(reason || "User is currently unavailable");
      cleanUpCall();
    };

    // 6. Call Ended by Peer
    const handleCallEnded = ({ reason } = {}) => {
      toast.info(reason || "Call ended");
      cleanUpCall();
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:unavailable", handleCallUnavailable);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:unavailable", handleCallUnavailable);
      socket.off("call:ended", handleCallEnded);
    };
  }, [playRingtone, rejectCall, startTimer, cleanUpCall]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanUpCall();
    };
  }, [cleanUpCall]);

  const value = {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    incomingCallData,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export default CallContext;

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

  // ==========================================
  // 1-on-1 Call States
  // ==========================================
  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'ringing' | 'connected'
  const [callType, setCallType] = useState("video"); // 'audio' | 'video'
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // In-call media control states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // ==========================================
  // Group & Meeting Call States
  // ==========================================
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [groupCallRoom, setGroupCallRoom] = useState(null); // { roomId, groupName }
  const [groupParticipants, setGroupParticipants] = useState([]); // [{ socketId, user, stream, isMicMuted, isCameraOff }]
  const [activeGroupCalls, setActiveGroupCalls] = useState({}); // { [roomId]: { active: boolean, participantCount: number } }

  // ==========================================
  // Internal Refs
  // ==========================================
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const activePeerIdRef = useRef(null);

  const groupPeerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const groupCandidateQueuesRef = useRef(new Map()); // socketId -> RTCIceCandidate[]
  const groupLocalStreamRef = useRef(null);
  const isGroupCallRef = useRef(false);
  const groupCallRoomRef = useRef(null);

  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    isGroupCallRef.current = isGroupCall;
  }, [isGroupCall]);

  useEffect(() => {
    groupCallRoomRef.current = groupCallRoom;
  }, [groupCallRoom]);

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

  // Media capture helper
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

  // 1-on-1 Full cleanup helper
  const cleanUpCall = useCallback(() => {
    stopRingtone();
    stopTimer();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

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

  // Setup 1-on-1 PeerConnection
  const createPeerConnection = useCallback(
    (targetUserId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && targetUserId) {
          socket.emit("call:ice-candidate", {
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
        } else {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
            setRemoteStream(remoteStreamRef.current);
          }
          remoteStreamRef.current.addTrack(event.track);
        }
      };

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

  // ============================================================
  // 1-on-1 Call Actions
  // ============================================================
  const initiateCall = useCallback(
    async ({ receiver, isVideo = true }) => {
      if (!receiver?._id) {
        toast.error("Invalid recipient");
        return;
      }
      if (callStatusRef.current !== "idle" || isGroupCallRef.current) {
        toast.warn("You are already in an active call");
        return;
      }

      try {
        const stream = await getMediaStream(isVideo);
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = createPeerConnection(receiver._id);
        activePeerIdRef.current = receiver._id;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setCallStatus("calling");
        setCallType(isVideo ? "video" : "audio");
        setRemoteUser(receiver);

        socket.emit("call:initiate", {
          receiverId: receiver._id,
          caller: currentUser,
          offer,
          isVideo: Boolean(isVideo),
        });

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

  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    const { caller, offer, isVideo } = incomingCallData;

    stopRingtone();

    try {
      const stream = await getMediaStream(isVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(caller._id);
      activePeerIdRef.current = caller._id;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      while (candidateQueueRef.current.length > 0) {
        const candidate = candidateQueueRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

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

  const endCall = useCallback(() => {
    const peerId = activePeerIdRef.current || remoteUser?._id || incomingCallData?.caller?._id;
    if (peerId) {
      socket.emit("call:end", { targetUserId: peerId });
    }
    cleanUpCall();
  }, [remoteUser, incomingCallData, cleanUpCall]);

  // ============================================================
  // Group & Meeting Call Logic (Multi-Peer Mesh)
  // ============================================================

  const leaveGroupCall = useCallback(() => {
    stopTimer();
    const roomId = groupCallRoomRef.current?.roomId;
    if (roomId) {
      socket.emit("group-call:leave", { roomId });
    }

    if (groupLocalStreamRef.current) {
      groupLocalStreamRef.current.getTracks().forEach((track) => track.stop());
      groupLocalStreamRef.current = null;
    }
    setLocalStream(null);

    // Close and remove all peer connections
    for (const [, pc] of groupPeerConnectionsRef.current.entries()) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
    }
    groupPeerConnectionsRef.current.clear();
    groupCandidateQueuesRef.current.clear();

    setIsGroupCall(false);
    isGroupCallRef.current = false;
    setGroupCallRoom(null);
    groupCallRoomRef.current = null;
    setGroupParticipants([]);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, [stopTimer]);

  const createGroupPeerConnection = useCallback((targetSocketId, localMediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("group-call:signal", {
          targetSocketId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      setGroupParticipants((prev) => {
        const existingIdx = prev.findIndex((p) => p.socketId === targetSocketId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], stream: incomingStream };
          return updated;
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            stream: incomingStream,
            user: null,
            isMicMuted: false,
            isCameraOff: false,
          },
        ];
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        pc.close();
        groupPeerConnectionsRef.current.delete(targetSocketId);
        setGroupParticipants((prev) => prev.filter((p) => p.socketId !== targetSocketId));
      }
    };

    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => pc.addTrack(track, localMediaStream));
    }

    groupPeerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, []);

  const startGroupCall = useCallback(
    async ({ roomId, groupName = "Group Call", isVideo = true }) => {
      if (!roomId) return;
      if (callStatusRef.current !== "idle" || isGroupCallRef.current) {
        toast.warn("You are already in an active call");
        return;
      }

      try {
        const stream = await getMediaStream(isVideo);
        groupLocalStreamRef.current = stream;
        setLocalStream(stream);
        setIsGroupCall(true);
        isGroupCallRef.current = true;
        const roomData = { roomId: roomId.toString(), groupName };
        setGroupCallRoom(roomData);
        groupCallRoomRef.current = roomData;
        setCallType(isVideo ? "video" : "audio");
        setGroupParticipants([]);
        startTimer();

        socket.emit("group-call:join", {
          roomId: roomId.toString(),
          user: currentUser,
          isVideo: Boolean(isVideo),
        });

        toast.success(`Joined ${groupName}`);
      } catch (err) {
        console.error("Failed to start group call:", err);
        leaveGroupCall();
      }
    },
    [currentUser, getMediaStream, startTimer, leaveGroupCall]
  );

  const joinGroupCall = startGroupCall;

  // ============================================================
  // Media Controls (Works for both 1-on-1 and Group Calls)
  // ============================================================
  const toggleMic = useCallback(() => {
    const activeStream = isGroupCallRef.current ? groupLocalStreamRef.current : localStreamRef.current;
    if (!activeStream) return;
    const audioTrack = activeStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsMicMuted(nextMuted);

      if (isGroupCallRef.current && groupCallRoomRef.current?.roomId) {
        socket.emit("group-call:toggle-media", {
          roomId: groupCallRoomRef.current.roomId,
          isMicMuted: nextMuted,
        });
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const activeStream = isGroupCallRef.current ? groupLocalStreamRef.current : localStreamRef.current;
    if (!activeStream) return;
    const videoTrack = activeStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextOff = !videoTrack.enabled;
      setIsCameraOff(nextOff);

      if (isGroupCallRef.current && groupCallRoomRef.current?.roomId) {
        socket.emit("group-call:toggle-media", {
          roomId: groupCallRoomRef.current.roomId,
          isCameraOff: nextOff,
        });
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pcs = isGroupCallRef.current
      ? Array.from(groupPeerConnectionsRef.current.values())
      : peerConnectionRef.current
      ? [peerConnectionRef.current]
      : [];

    if (pcs.length === 0) return;

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        // Store original camera track
        const firstSender = pcs[0].getSenders().find((s) => s.track && s.track.kind === "video");
        if (firstSender) {
          originalVideoTrackRef.current = firstSender.track;
        }

        // Replace across all active peer connections
        for (const pc of pcs) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = async () => {
          if (originalVideoTrackRef.current) {
            for (const pc of pcs) {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
              if (sender) {
                await sender.replaceTrack(originalVideoTrackRef.current);
              }
            }
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
      if (originalVideoTrackRef.current) {
        for (const pc of pcs) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(originalVideoTrackRef.current);
          }
        }
      }
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  // ============================================================
  // Socket Signaling Event Listeners
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    // 1. 1-on-1 Incoming Call
    const handleIncomingCall = ({ caller, offer, isVideo }) => {
      if (callStatusRef.current !== "idle" || isGroupCallRef.current) {
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

      ringTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === "ringing") {
          toast.info("Missed call");
          rejectCall("No answer");
        }
      }, 30000);
    };

    // 2. 1-on-1 Call Accepted
    const handleCallAccepted = async ({ answer }) => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

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

    // 3. 1-on-1 ICE Candidate
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
        candidateQueueRef.current.push(candidate);
      }
    };

    const handleCallRejected = ({ reason }) => {
      toast.info(reason || "Call was declined");
      cleanUpCall();
    };

    const handleCallUnavailable = ({ reason }) => {
      toast.warn(reason || "User is currently unavailable");
      cleanUpCall();
    };

    const handleCallEnded = ({ reason } = {}) => {
      toast.info(reason || "Call ended");
      cleanUpCall();
    };

    // ==========================================
    // Group Call Event Handlers
    // ==========================================

    const handleGroupStatus = ({ roomId, active, participantCount }) => {
      setActiveGroupCalls((prev) => ({
        ...prev,
        [roomId]: { active: Boolean(active), participantCount: participantCount || 0 },
      }));
    };

    const handleExistingUsers = async ({ participants }) => {
      if (!isGroupCallRef.current || !groupLocalStreamRef.current) return;

      for (const participant of participants) {
        const pc = createGroupPeerConnection(participant.socketId, groupLocalStreamRef.current);

        setGroupParticipants((prev) => {
          if (!prev.some((p) => p.socketId === participant.socketId)) {
            return [
              ...prev,
              {
                socketId: participant.socketId,
                user: participant.user,
                stream: null,
                isMicMuted: participant.isMicMuted,
                isCameraOff: participant.isCameraOff,
              },
            ];
          }
          return prev;
        });

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("group-call:signal", {
            targetSocketId: participant.socketId,
            signal: {
              type: "offer",
              sdp: offer,
              user: currentUser,
            },
          });
        } catch (e) {
          console.error("Failed to create offer for existing peer:", e);
        }
      }
    };

    const handleUserJoined = ({ socketId, user }) => {
      if (!isGroupCallRef.current) return;
      toast.info(`${user?.firstName || "A member"} joined the call`);
      setGroupParticipants((prev) => {
        if (!prev.some((p) => p.socketId === socketId)) {
          return [
            ...prev,
            {
              socketId,
              user,
              stream: null,
              isMicMuted: false,
              isCameraOff: false,
            },
          ];
        }
        return prev;
      });
    };

    const handleGroupSignal = async ({ fromSocketId, signal }) => {
      if (!isGroupCallRef.current) return;

      if (signal.type === "offer") {
        let pc = groupPeerConnectionsRef.current.get(fromSocketId);
        if (!pc) {
          pc = createGroupPeerConnection(fromSocketId, groupLocalStreamRef.current);
        }

        if (signal.user) {
          setGroupParticipants((prev) => {
            const idx = prev.findIndex((p) => p.socketId === fromSocketId);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], user: signal.user };
              return updated;
            }
            return [
              ...prev,
              {
                socketId: fromSocketId,
                user: signal.user,
                stream: null,
                isMicMuted: false,
                isCameraOff: false,
              },
            ];
          });
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          const queue = groupCandidateQueuesRef.current.get(fromSocketId) || [];
          while (queue.length > 0) {
            const c = queue.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (err) {
              console.warn("Error adding queued group candidate:", err);
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("group-call:signal", {
            targetSocketId: fromSocketId,
            signal: { type: "answer", sdp: answer },
          });
        } catch (e) {
          console.error("Error answering group offer:", e);
        }
      } else if (signal.type === "answer") {
        const pc = groupPeerConnectionsRef.current.get(fromSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const queue = groupCandidateQueuesRef.current.get(fromSocketId) || [];
            while (queue.length > 0) {
              const c = queue.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (err) {
                console.warn("Error adding queued group candidate:", err);
              }
            }
          } catch (e) {
            console.error("Error setting group answer remote description:", e);
          }
        }
      } else if (signal.type === "candidate" && signal.candidate) {
        const pc = groupPeerConnectionsRef.current.get(fromSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn("Error adding group candidate:", e);
          }
        } else {
          if (!groupCandidateQueuesRef.current.has(fromSocketId)) {
            groupCandidateQueuesRef.current.set(fromSocketId, []);
          }
          groupCandidateQueuesRef.current.get(fromSocketId).push(signal.candidate);
        }
      }
    };

    const handleMediaChanged = ({ socketId, isMicMuted: muted, isCameraOff: off }) => {
      setGroupParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === socketId) {
            return {
              ...p,
              isMicMuted: typeof muted === "boolean" ? muted : p.isMicMuted,
              isCameraOff: typeof off === "boolean" ? off : p.isCameraOff,
            };
          }
          return p;
        })
      );
    };

    const handleUserLeft = ({ socketId }) => {
      const pc = groupPeerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
        groupPeerConnectionsRef.current.delete(socketId);
      }
      groupCandidateQueuesRef.current.delete(socketId);

      setGroupParticipants((prev) => {
        const leaving = prev.find((p) => p.socketId === socketId);
        if (leaving?.user?.firstName) {
          toast.info(`${leaving.user.firstName} left the call`);
        }
        return prev.filter((p) => p.socketId !== socketId);
      });
    };

    // Attach all listeners
    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:unavailable", handleCallUnavailable);
    socket.on("call:ended", handleCallEnded);

    socket.on("group-call:status", handleGroupStatus);
    socket.on("group-call:existing-users", handleExistingUsers);
    socket.on("group-call:user-joined", handleUserJoined);
    socket.on("group-call:signal", handleGroupSignal);
    socket.on("group-call:media-changed", handleMediaChanged);
    socket.on("group-call:user-left", handleUserLeft);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:unavailable", handleCallUnavailable);
      socket.off("call:ended", handleCallEnded);

      socket.off("group-call:status", handleGroupStatus);
      socket.off("group-call:existing-users", handleExistingUsers);
      socket.off("group-call:user-joined", handleUserJoined);
      socket.off("group-call:signal", handleGroupSignal);
      socket.off("group-call:media-changed", handleMediaChanged);
      socket.off("group-call:user-left", handleUserLeft);
    };
  }, [
    currentUser,
    playRingtone,
    rejectCall,
    startTimer,
    cleanUpCall,
    createGroupPeerConnection,
  ]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isGroupCallRef.current) {
        leaveGroupCall();
      } else {
        cleanUpCall();
      }
    };
  }, [cleanUpCall, leaveGroupCall]);

  const value = {
    // 1-on-1 call states & methods
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

    // Group & Meeting Call states & methods
    isGroupCall,
    groupCallRoom,
    groupParticipants,
    activeGroupCalls,
    startGroupCall,
    joinGroupCall,
    leaveGroupCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export default CallContext;

import { useEffect, useRef, useState } from "react";
import { useCall } from "../../hooks/useWebRTC";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaPhoneSlash,
  FaExpand,
  FaCompress,
  FaChalkboard,
} from "react-icons/fa";

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const CallOverlay = () => {
  const {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    isWhiteboardOpen,
    toggleWhiteboard,
  } = useCall();

  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  // Only render during calling or connected states
  if (callStatus !== "calling" && callStatus !== "connected") {
    return null;
  }

  const isVideo = callType === "video";
  const peerName = remoteUser
    ? `${remoteUser.firstName || "User"} ${remoteUser.lastName || ""}`.trim()
    : "Connected User";

  // Minimized Floating Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-richblack-800/95 border border-yellow-400/40 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-md animate-fadeIn">
        <div className="relative">
          <img
            src={
              remoteUser?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                peerName
              )}`
            }
            alt={peerName}
            className="w-10 h-10 rounded-full object-cover border border-yellow-400"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-richblack-900" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-richblack-5 line-clamp-1 max-w-[120px]">
            {peerName}
          </span>
          <span className="text-[10px] text-yellow-400 font-mono">
            {callStatus === "calling" ? "Calling..." : formatDuration(callDuration)}
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-2 text-richblack-300 hover:text-white"
          title="Maximize Call"
        >
          <FaExpand size={13} />
        </button>
        <button
          onClick={endCall}
          className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white"
          title="End Call"
        >
          <FaPhoneSlash size={13} />
        </button>
      </div>
    );
  }

  // Full Overlay View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[720px] bg-richblack-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  remoteUser?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    peerName
                  )}`
                }
                alt={peerName}
                className="w-10 h-10 rounded-full object-cover border border-yellow-400/60"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white line-clamp-1">
                {peerName}
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {callStatus === "calling"
                  ? "Ringing remote peer..."
                  : formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-2.5 rounded-full bg-richblack-800/80 hover:bg-richblack-700 text-richblack-200 hover:text-white transition-colors"
            title="Minimize"
          >
            <FaCompress size={14} />
          </button>
        </div>

        {/* Video / Visualizer Display Area */}
        <div className="relative flex-1 w-full h-full bg-richblack-950 flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <>
              {/* Remote Video Stream */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover sm:object-contain bg-black"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-richblack-400">
                  <div className="relative">
                    <img
                      src={
                        remoteUser?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          peerName
                        )}`
                      }
                      alt={peerName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400/40 shadow-xl"
                    />
                    {callStatus === "calling" && (
                      <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-60" />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {callStatus === "calling"
                      ? "Waiting for response..."
                      : "Connecting remote video..."}
                  </p>
                </div>
              )}

              {/* Picture-in-Picture Local Video Preview */}
              <div className="absolute bottom-24 right-4 sm:right-6 w-28 sm:w-44 aspect-video bg-richblack-800 rounded-xl overflow-hidden shadow-2xl border border-white/20 z-20">
                {isCameraOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-richblack-800 text-richblack-400 text-xs">
                    Camera Off
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                )}
                <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                  You
                </span>
              </div>
            </>
          ) : (
            /* Audio Call Representation */
            <div className="flex flex-col items-center justify-center gap-6 p-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-yellow-400/10 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-yellow-400/20 flex items-center justify-center animate-pulse">
                    <img
                      src={
                        remoteUser?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          peerName
                        )}`
                      }
                      alt={peerName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shadow-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{peerName}</h3>
                <p className="text-sm text-yellow-400 mt-1 font-mono">
                  {callStatus === "calling"
                    ? "Calling..."
                    : `In Voice Call • ${formatDuration(callDuration)}`}
                </p>
              </div>

              {/* Hidden audio tag for remote stream */}
              <audio ref={remoteVideoRef} autoPlay />
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="shrink-0 p-4 sm:p-6 bg-richblack-900/90 border-t border-white/10 flex items-center justify-center gap-4 sm:gap-6 z-20">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-3.5 sm:p-4 rounded-full transition-all ${
              isMicMuted
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-richblack-800 text-white hover:bg-richblack-700"
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? (
              <FaMicrophoneSlash size={18} />
            ) : (
              <FaMicrophone size={18} />
            )}
          </button>

          {/* Camera Toggle (Video Call Only) */}
          {isVideo && (
            <button
              onClick={toggleCamera}
              className={`p-3.5 sm:p-4 rounded-full transition-all ${
                isCameraOff
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-richblack-800 text-white hover:bg-richblack-700"
              }`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
            </button>
          )}

          {/* Screen Share Toggle (Desktop/Video Call Only) */}
          {isVideo && (
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 sm:p-4 rounded-full transition-all ${
                isScreenSharing
                  ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                  : "bg-richblack-800 text-white hover:bg-richblack-700"
              }`}
              title={
                isScreenSharing ? "Stop Screen Share" : "Share Your Screen"
              }
            >
              <FaDesktop size={18} />
            </button>
          )}

          {/* Collaborative Whiteboard (available once connected) */}
          {callStatus === "connected" && (
            <button
              onClick={toggleWhiteboard}
              className={`p-3.5 sm:p-4 rounded-full transition-all ${
                isWhiteboardOpen
                  ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                  : "bg-richblack-800 text-white hover:bg-richblack-700"
              }`}
              title={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
              aria-label={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
            >
              <FaChalkboard size={18} />
            </button>
          )}

          {/* End / Hang Up Call */}
          <button
            onClick={endCall}
            className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
            title="End Call"
          >
            <FaPhoneSlash size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;

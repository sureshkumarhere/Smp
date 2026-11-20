import { useEffect, useRef, useState } from "react";
import { useCall } from "../../hooks/useWebRTC";
import { useSelector } from "react-redux";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaPhoneSlash,
  FaExpand,
  FaCompress,
  FaUsers,
  FaChalkboard,
} from "react-icons/fa";

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Sub-component to manage a remote participant's video element cleanly
const RemotePeerTile = ({ participant }) => {
  const videoRef = useRef(null);
  const { stream, user, isMicMuted, isCameraOff } = participant;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const name = user
    ? `${user.firstName || "Member"} ${user.lastName || ""}`.trim()
    : "Participant";

  return (
    <div className="relative w-full h-full min-h-[160px] bg-richblack-800 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-lg group">
      {/* Stream video feed */}
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <div className="relative">
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  name
                )}`
              }
              alt={name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-yellow-400/40 shadow-md"
            />
          </div>
          <span className="text-xs text-richblack-300 font-medium line-clamp-1">
            {name}
          </span>
        </div>
      )}

      {/* Name and mic badge */}
      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs">
        <span className="font-semibold truncate max-w-[140px]">{name}</span>
        {isMicMuted ? (
          <span className="p-1 rounded-full bg-red-500/80 text-white" title="Muted">
            <FaMicrophoneSlash size={10} />
          </span>
        ) : (
          <span className="p-1 rounded-full bg-green-500/80 text-white" title="Speaking">
            <FaMicrophone size={10} />
          </span>
        )}
      </div>
    </div>
  );
};

const GroupCallOverlay = () => {
  const {
    isGroupCall,
    groupCallRoom,
    groupParticipants,
    localStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    leaveGroupCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    isWhiteboardOpen,
    toggleWhiteboard,
  } = useCall();

  const currentUser = useSelector((store) => store?.auth);
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!isGroupCall) return null;

  const totalCount = groupParticipants.length + 1; // including local user
  const meetingTitle = groupCallRoom?.groupName || "Group Meeting";

  // Grid styling based on participant count
  const getGridClasses = () => {
    if (totalCount === 1) return "grid-cols-1";
    if (totalCount === 2) return "grid-cols-1 sm:grid-cols-2";
    if (totalCount <= 4) return "grid-cols-2";
    return "grid-cols-2 sm:grid-cols-3";
  };

  // Minimized Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-richblack-800/95 border border-yellow-400/40 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-md animate-fadeIn">
        <div className="p-2.5 rounded-full bg-yellow-400/20 text-yellow-400">
          <FaUsers size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-richblack-5 line-clamp-1 max-w-[130px]">
            {meetingTitle}
          </span>
          <span className="text-[10px] text-yellow-400 font-mono">
            {totalCount} in call • {formatDuration(callDuration)}
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
          onClick={leaveGroupCall}
          className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white"
          title="Leave Meeting"
        >
          <FaPhoneSlash size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-richblack-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent border-b border-white/5 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-400/20 text-yellow-400">
              <FaUsers size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {meetingTitle}
              </h2>
              <p className="text-xs text-yellow-400 font-mono flex items-center gap-2">
                <span>{formatDuration(callDuration)}</span>
                <span>•</span>
                <span>{totalCount} {totalCount === 1 ? "participant" : "participants"}</span>
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

        {/* Video Grid Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto scroll-style flex items-center justify-center">
          <div className={`grid ${getGridClasses()} gap-3 w-full h-full max-h-full auto-rows-fr`}>
            {/* Local participant tile */}
            <div className="relative w-full h-full min-h-[160px] bg-richblack-800 rounded-2xl overflow-hidden border border-yellow-400/30 flex items-center justify-center shadow-lg group">
              {localStream && !isCameraOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <img
                    src={
                      currentUser?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        currentUser?.firstName || "You"
                      )}`
                    }
                    alt="You"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                  />
                  <span className="text-xs text-richblack-300 font-medium">You (Camera off)</span>
                </div>
              )}

              {/* Local badge */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs">
                <span className="font-semibold">You</span>
                {isMicMuted ? (
                  <span className="p-1 rounded-full bg-red-500/80 text-white" title="Muted">
                    <FaMicrophoneSlash size={10} />
                  </span>
                ) : (
                  <span className="p-1 rounded-full bg-green-500/80 text-white" title="Mic On">
                    <FaMicrophone size={10} />
                  </span>
                )}
              </div>
            </div>

            {/* Remote participant tiles */}
            {groupParticipants.map((p) => (
              <RemotePeerTile key={p.socketId} participant={p} />
            ))}
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="shrink-0 p-4 sm:p-5 bg-richblack-900/95 border-t border-white/10 flex items-center justify-center gap-4 sm:gap-6 z-20">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`p-3.5 sm:p-4 rounded-full transition-all ${
              isMicMuted
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-richblack-800 text-white hover:bg-richblack-700"
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
          </button>

          {/* Camera */}
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

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 sm:p-4 rounded-full transition-all ${
              isScreenSharing
                ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                : "bg-richblack-800 text-white hover:bg-richblack-700"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
          >
            <FaDesktop size={18} />
          </button>

          {/* Collaborative Whiteboard */}
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

          {/* Leave Meeting */}
          <button
            onClick={leaveGroupCall}
            className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30 flex items-center gap-2 px-5"
            title="Leave Meeting"
          >
            <FaPhoneSlash size={18} />
            <span className="hidden sm:inline font-semibold text-xs">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCallOverlay;

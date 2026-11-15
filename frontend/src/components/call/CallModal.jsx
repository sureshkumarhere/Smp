import { useCall } from "../../hooks/useWebRTC";
import { FaPhone, FaPhoneSlash, FaVideo } from "react-icons/fa";

const CallModal = () => {
  const {
    callStatus,
    incomingCallData,
    acceptCall,
    rejectCall,
  } = useCall();

  if (callStatus !== "ringing" || !incomingCallData) {
    return null;
  }

  const caller = incomingCallData.caller || {};
  const callerName = `${caller.firstName || "Someone"} ${caller.lastName || ""}`.trim();
  const isVideo = incomingCallData.isVideo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-richblack-800 border border-yellow-400/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow ambient ring */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Incoming call badge */}
        <span className="text-xs uppercase font-semibold tracking-wider text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full mb-4">
          Incoming {isVideo ? "Video" : "Audio"} Call
        </span>

        {/* Pulsing Avatar */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping opacity-75" />
          <img
            src={
              caller.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                callerName || "User"
              )}`
            }
            alt={callerName}
            className="relative w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shadow-lg"
          />
        </div>

        {/* Caller Name & Type */}
        <h3 className="text-lg font-bold text-richblack-5 line-clamp-1">
          {callerName}
        </h3>
        <p className="text-xs text-richblack-300 mt-1 mb-6 flex items-center gap-1.5 justify-center">
          {isVideo ? (
            <FaVideo className="text-yellow-400" />
          ) : (
            <FaPhone className="text-yellow-400" />
          )}
          {isVideo ? "Video Call Invitation" : "Voice Call Invitation"}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full pt-2">
          {/* Decline */}
          <button
            onClick={() => rejectCall("Call declined")}
            className="flex flex-col items-center gap-1 text-xs text-richblack-200 hover:text-red-400 transition-colors"
            title="Decline Call"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all">
              <FaPhoneSlash size={20} />
            </div>
            <span>Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={() => acceptCall()}
            className="flex flex-col items-center gap-1 text-xs text-richblack-200 hover:text-green-400 transition-colors"
            title="Accept Call"
          >
            <div className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all animate-bounce">
              <FaPhone size={20} />
            </div>
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

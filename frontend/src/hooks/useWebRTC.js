import { useContext } from "react";
import { CallContext } from "../context/CallContext";

/**
 * Custom hook providing WebRTC call management, media tracks, and signaling actions.
 */
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};

export const useWebRTC = useCall;

export default useWebRTC;

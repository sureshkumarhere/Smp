import { describe, expect, test } from "vitest";
import { CallContext } from "../context/CallContext";
import useWebRTC, { useCall } from "../hooks/useWebRTC";
import { ICE_SERVERS } from "../utils/webrtcConfig";

describe("WebRTC Configuration & Hook Unit Tests", () => {
  test("should provide standard STUN ice servers for NAT traversal", () => {
    expect(ICE_SERVERS).toBeDefined();
    expect(Array.isArray(ICE_SERVERS.iceServers)).toBe(true);
    expect(ICE_SERVERS.iceServers.length).toBeGreaterThanOrEqual(1);

    const urls = ICE_SERVERS.iceServers.map((s) => s.urls);
    expect(urls).toContain("stun:stun.l.google.com:19302");
  });

  test("CallContext should be a valid React Context object", () => {
    expect(CallContext).toBeDefined();
    expect(typeof CallContext.Provider).toBe("object");
  });

  test("useWebRTC and useCall hooks should be valid exported functions", () => {
    expect(typeof useWebRTC).toBe("function");
    expect(typeof useCall).toBe("function");
    expect(useWebRTC).toBe(useCall);
  });
});

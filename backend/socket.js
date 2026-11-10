const { Server } = require("socket.io");

let io = null;
// Track online user ids
const onlineUsers = new Set();
// Track active 1-on-1 calls to handle unexpected disconnections (userId -> peerUserId)
const activeCalls = new Map();

const initSocket = (server, corsOptions) => {
	io = new Server(server, {
		pingTimeout: 60000,
		transports: ["websocket"],
		cors: corsOptions,
	});

	io.on("connection", (socket) => {
		console.log("New socket connection:", socket.id);

		// ==========================================
		// 1. User Setup & Presence
		// ==========================================
		socket.on("setup", (userId) => {
			socket.join(userId);
			// Track presence
			if (userId) {
				onlineUsers.add(userId.toString());
				socket.userId = userId.toString();
				// Broadcast to all (frontend filters by mentor-only)
				io.emit("user online", userId.toString());
				// Send current online list to the newly connected user
				socket.emit("online users", Array.from(onlineUsers));
			}
			console.log(`User ${userId} connected`);
			socket.emit("connected");
		});

		// ==========================================
		// 2. Chat Rooms & Messaging
		// ==========================================
		socket.on("join chat", (roomId) => {
			socket.join(roomId);
			console.log(`User joined chat room: ${roomId}`);
		});

		socket.on("new message", (newMessage) => {
			const chat = newMessage.chat;
			if (!chat?.users) return;

			chat.users.forEach((user) => {
				if (user._id === newMessage.sender._id) return;
				socket.in(user._id).emit("message received", newMessage);
			});
		});

		// Broadcast reaction update to everyone in the chat
		socket.on("react message", (payload) => {
			const chat = payload?.chat;
			if (!chat?.users) return;
			chat.users.forEach((user) => {
				if (user._id === payload?.sender?._id) return;
				socket.in(user._id).emit("message reacted", payload);
			});
		});

		socket.on("typing", (roomId) => socket.in(roomId).emit("typing"));
		socket.on("stop typing", (roomId) => socket.in(roomId).emit("stop typing"));

		// ==========================================
		// 3. WebRTC 1-on-1 Audio & Video Signaling
		// ==========================================

		/**
		 * Initiate Call:
		 * Caller sends SDP offer along with call metadata (audio vs video, caller profile).
		 * Server routes this offer to the receiver's personal socket room.
		 */
		socket.on("call:initiate", ({ receiverId, caller, offer, isVideo }) => {
			if (!receiverId || !offer) return;

			// Check if receiver is online
			const isOnline = onlineUsers.has(receiverId.toString());
			if (!isOnline) {
				socket.emit("call:unavailable", {
					receiverId,
					reason: "User is currently offline",
				});
				return;
			}

			// Check if receiver is already on another call
			if (activeCalls.has(receiverId.toString())) {
				socket.emit("call:rejected", {
					reason: "User is busy on another call",
				});
				return;
			}

			// Forward the incoming call invitation with SDP offer to the receiver
			socket.to(receiverId.toString()).emit("call:incoming", {
				caller,
				offer,
				isVideo: Boolean(isVideo),
			});
		});

		/**
		 * Accept Call:
		 * Receiver accepts the call and returns an SDP answer.
		 * Server notifies caller that the connection is accepted and records the active call.
		 */
		socket.on("call:accept", ({ callerId, answer }) => {
			if (!callerId || !answer) return;

			const currentUserId = socket.userId;
			if (currentUserId) {
				// Record active call mapping for both participants to handle unexpected dropouts
				activeCalls.set(currentUserId.toString(), callerId.toString());
				activeCalls.set(callerId.toString(), currentUserId.toString());
			}

			// Send SDP answer back to the caller to finalize peer connection
			socket.to(callerId.toString()).emit("call:accepted", {
				answer,
				receiverId: currentUserId,
			});
		});

		/**
		 * Exchange ICE Candidates:
		 * Relays NAT traversal candidates discovered by STUN/TURN between both peers.
		 */
		socket.on("call:ice-candidate", ({ targetUserId, candidate }) => {
			if (!targetUserId || !candidate) return;

			socket.to(targetUserId.toString()).emit("call:ice-candidate", {
				candidate,
				fromUserId: socket.userId,
			});
		});

		/**
		 * Reject Call:
		 * Receiver declines the call (or cancels due to timeout).
		 */
		socket.on("call:reject", ({ callerId, reason = "Call declined" }) => {
			if (!callerId) return;

			socket.to(callerId.toString()).emit("call:rejected", { reason });
		});

		/**
		 * End Call:
		 * Either peer hangs up the call. Cleans up active call session and alerts peer.
		 */
		socket.on("call:end", ({ targetUserId }) => {
			const currentUserId = socket.userId;

			if (currentUserId) {
				activeCalls.delete(currentUserId.toString());
			}
			if (targetUserId) {
				activeCalls.delete(targetUserId.toString());
				socket.to(targetUserId.toString()).emit("call:ended");
			}
		});

		// ==========================================
		// 4. Socket Disconnect & Cleanup
		// ==========================================
		socket.on("disconnect", () => {
			const disconnectedUserId = socket.userId;

			if (disconnectedUserId) {
				// If user was in an active call, notify their peer before cleanup
				if (activeCalls.has(disconnectedUserId)) {
					const peerId = activeCalls.get(disconnectedUserId);
					if (peerId) {
						socket.to(peerId).emit("call:ended", {
							reason: "Peer disconnected unexpectedly",
						});
						activeCalls.delete(peerId);
					}
					activeCalls.delete(disconnectedUserId);
				}

				onlineUsers.delete(disconnectedUserId);
				io.emit("user offline", disconnectedUserId);
			}

			console.log("User disconnected:", socket.id);
			socket.removeAllListeners();
		});
	});

	return io;
};

const getIO = () => {
	if (!io) {
		throw new Error("Socket.io has not been initialized!");
	}
	return io;
};

module.exports = { initSocket, getIO };

const { Server } = require("socket.io");
const {
	WhiteboardStore,
	normalizeBoardId,
	sanitizeStroke,
} = require("./utils/whiteboard");

let io = null;
// Track online user ids
const onlineUsers = new Set();
// Track active 1-on-1 calls to handle unexpected disconnections (userId -> peerUserId)
const activeCalls = new Map();
// Track active group calls (roomId -> Map(socketId -> { userId, user, isVideo, isMicMuted, isCameraOff }))
const groupCalls = new Map();
// Quick mapping of socketId -> roomId for group calls
const socketToGroupRoom = new Map();
// Shared whiteboard state, keyed by call/meeting room id
const whiteboards = new WhiteboardStore();
// Quick mapping of socketId -> whiteboard Socket.IO room name
const socketToWhiteboardRoom = new Map();

const whiteboardRoomName = (roomId) => {
	const boardId = normalizeBoardId(roomId);
	return boardId ? `whiteboard:${boardId}` : null;
};

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
		// 4. WebRTC Group & Meeting Call Signaling
		// ==========================================

		const removeUserFromGroupCall = (userSocket, roomId) => {
			if (!roomId) return;
			const rId = roomId.toString();
			const roomMap = groupCalls.get(rId);
			if (roomMap && roomMap.has(userSocket.id)) {
				const participant = roomMap.get(userSocket.id);
				roomMap.delete(userSocket.id);
				socketToGroupRoom.delete(userSocket.id);
				userSocket.leave(`group-call:${rId}`);

				// Notify remaining members in the group call
				userSocket.to(`group-call:${rId}`).emit("group-call:user-left", {
					socketId: userSocket.id,
					userId: participant?.userId || userSocket.userId,
				});

				// Broadcast active call count to the main chat room
				const participantCount = roomMap.size;
				const isActive = participantCount > 0;
				if (!isActive) {
					groupCalls.delete(rId);
					// The meeting is over, so its shared canvas can be discarded.
					whiteboards.deleteBoard(`meeting:${rId}`);
				}
				io.to(rId).emit("group-call:status", {
					roomId: rId,
					active: isActive,
					participantCount,
				});
			}
		};

		socket.on("group-call:join", ({ roomId, user, isVideo }) => {
			if (!roomId) return;
			const rId = roomId.toString();
			socket.join(`group-call:${rId}`);

			if (!groupCalls.has(rId)) {
				groupCalls.set(rId, new Map());
			}
			const roomMap = groupCalls.get(rId);

			// Collect existing participants to send back to the newly joining peer
			const existingParticipants = [];
			for (const [existingSocketId, participantData] of roomMap.entries()) {
				existingParticipants.push({
					socketId: existingSocketId,
					user: participantData.user,
					isVideo: participantData.isVideo,
					isMicMuted: participantData.isMicMuted,
					isCameraOff: participantData.isCameraOff,
				});
			}

			// Add the new participant
			roomMap.set(socket.id, {
				userId: user?._id || socket.userId,
				user,
				isVideo: Boolean(isVideo),
				isMicMuted: false,
				isCameraOff: !isVideo,
			});
			socketToGroupRoom.set(socket.id, rId);

			// Return list of peers already in call so newcomer can initiate peer connections
			socket.emit("group-call:existing-users", {
				participants: existingParticipants,
				roomId: rId,
			});

			// Notify existing peers
			socket.to(`group-call:${rId}`).emit("group-call:user-joined", {
				socketId: socket.id,
				user,
				isVideo: Boolean(isVideo),
			});

			// Broadcast active status to the chat
			io.to(rId).emit("group-call:status", {
				roomId: rId,
				active: true,
				participantCount: roomMap.size,
			});
		});

		// Relay WebRTC mesh signals (offer / answer / candidate)
		socket.on("group-call:signal", ({ targetSocketId, signal }) => {
			if (!targetSocketId || !signal) return;
			socket.to(targetSocketId).emit("group-call:signal", {
				fromSocketId: socket.id,
				signal,
			});
		});

		// Broadcast media status changes (mute, camera toggle)
		socket.on("group-call:toggle-media", ({ roomId, isMicMuted, isCameraOff }) => {
			if (!roomId) return;
			const rId = roomId.toString();
			const roomMap = groupCalls.get(rId);
			if (roomMap && roomMap.has(socket.id)) {
				const participant = roomMap.get(socket.id);
				if (typeof isMicMuted === "boolean") participant.isMicMuted = isMicMuted;
				if (typeof isCameraOff === "boolean") participant.isCameraOff = isCameraOff;

				socket.to(`group-call:${rId}`).emit("group-call:media-changed", {
					socketId: socket.id,
					isMicMuted: participant.isMicMuted,
					isCameraOff: participant.isCameraOff,
				});
			}
		});

		socket.on("group-call:leave", ({ roomId }) => {
			removeUserFromGroupCall(socket, roomId);
		});

		socket.on("group-call:get-status", ({ roomId }) => {
			if (!roomId) return;
			const rId = roomId.toString();
			const roomMap = groupCalls.get(rId);
			socket.emit("group-call:status", {
				roomId: rId,
				active: roomMap ? roomMap.size > 0 : false,
				participantCount: roomMap ? roomMap.size : 0,
			});
		});

		// ==========================================
		// 4b. Collaborative Whiteboard (Call Canvas)
		// ==========================================

		const leaveWhiteboard = (peerSocket) => {
			const room = socketToWhiteboardRoom.get(peerSocket.id);
			if (!room) return;

			peerSocket.leave(room);
			socketToWhiteboardRoom.delete(peerSocket.id);
			// Keep the board: closing the panel should not erase the meeting's work.
		};

		// Only sockets that explicitly joined a board may draw on it.
		const getActiveWhiteboardRoom = (roomId) => {
			const room = whiteboardRoomName(roomId);
			return room && socketToWhiteboardRoom.get(socket.id) === room ? room : null;
		};

		socket.on("whiteboard:join", ({ roomId } = {}) => {
			const room = whiteboardRoomName(roomId);
			if (!room) return;

			const previousRoom = socketToWhiteboardRoom.get(socket.id);
			if (previousRoom && previousRoom !== room) leaveWhiteboard(socket);

			socket.join(room);
			socketToWhiteboardRoom.set(socket.id, room);

			const boardId = room.slice("whiteboard:".length);
			socket.emit("whiteboard:init", {
				roomId: boardId,
				strokes: whiteboards.getStrokes(boardId),
			});
		});

		// In-progress strokes are relayed to peers so drawing appears live.
		socket.on("whiteboard:preview", ({ roomId, stroke } = {}) => {
			const room = getActiveWhiteboardRoom(roomId);
			if (!room) return;

			const preview = sanitizeStroke(stroke, socket.userId);
			if (!preview) return;

			socket.to(room).emit("whiteboard:preview", {
				roomId: room.slice("whiteboard:".length),
				stroke: preview,
				socketId: socket.id,
			});
		});

		socket.on("whiteboard:stroke", ({ roomId, stroke } = {}) => {
			const room = getActiveWhiteboardRoom(roomId);
			if (!room) return;

			const boardId = room.slice("whiteboard:".length);
			const saved = whiteboards.addStroke(boardId, stroke, socket.userId);
			if (!saved) return;

			// Exclude the sender: it already committed the stroke locally.
			socket.to(room).emit("whiteboard:stroke", { roomId: boardId, stroke: saved });
		});

		socket.on("whiteboard:undo", ({ roomId, strokeId } = {}) => {
			const room = getActiveWhiteboardRoom(roomId);
			if (!room) return;

			const boardId = room.slice("whiteboard:".length);
			const removed = whiteboards.undoStroke(boardId, strokeId, socket.userId);
			if (!removed) return;

			socket.to(room).emit("whiteboard:undo", { roomId: boardId, strokeId: removed.id });
		});

		socket.on("whiteboard:clear", ({ roomId } = {}) => {
			const room = getActiveWhiteboardRoom(roomId);
			if (!room) return;

			const boardId = room.slice("whiteboard:".length);
			whiteboards.clearBoard(boardId);
			socket.to(room).emit("whiteboard:clear", { roomId: boardId });
		});

		socket.on("whiteboard:leave", () => leaveWhiteboard(socket));

		// ==========================================
		// 5. Socket Disconnect & Cleanup
		// ==========================================
		socket.on("disconnect", () => {
			// Leave the whiteboard before the socket leaves all rooms
			leaveWhiteboard(socket);

			// Clean up group call if user was in one
			if (socketToGroupRoom.has(socket.id)) {
				const groupRoomId = socketToGroupRoom.get(socket.id);
				removeUserFromGroupCall(socket, groupRoomId);
			}

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

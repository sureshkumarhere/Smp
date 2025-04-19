import React, { useEffect, useRef, useState } from "react";
import { FaFolderOpen, FaPaperPlane, FaSmile } from "react-icons/fa";
import { LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Picker from "emoji-picker-react";

import { setSendLoading, setTyping } from "../../redux/slices/conditionSlice";
import { addNewMessage, addNewMessageId } from "../../redux/slices/messageSlice";
import socket from "../../socket/socket";

let lastTypingTime;

const MessageSend = ({ chatId }) => {
	const mediaFile = useRef();
	const [newMessage, setMessage] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const dispatch = useDispatch();
	const isSendLoading = useSelector((state) => state?.condition?.isSendLoading);
	const isSocketConnected = useSelector((state) => state?.condition?.isSocketConnected);
	const isTyping = useSelector((state) => state?.condition?.isTyping);
	const selectedChat = useSelector((state) => state?.myChat?.selectedChat);

	useEffect(() => {
		socket.on("typing", () => dispatch(setTyping(true)));
		socket.on("stop typing", () => dispatch(setTyping(false)));
	}, [dispatch]);

	// Placeholder for media upload feature
	const handleMediaBox = () => {
		if (mediaFile.current?.files[0]) {
			toast.warn("Media upload feature coming soon...");
		}
	};

	// Send message
	const handleSendMessage = async () => {
		const message = newMessage.trim();
		if (!message) return;

		setMessage("");
		socket.emit("stop typing", selectedChat._id);
		dispatch(setSendLoading(true));

		const token = localStorage.getItem("token");

		try {
			const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ message, chatId }),
			});
			const result = await response.json();

			dispatch(addNewMessageId(result?.data?._id));
			dispatch(addNewMessage(result?.data));
			socket.emit("new message", result?.data);
		} catch (err) {
			console.error(err);
			toast.error("Message sending failed");
		} finally {
			dispatch(setSendLoading(false));
		}
	};

	// Typing handler
	const handleTyping = (e) => {
		const value = e.target.value;
		setMessage(value);

		if (!isSocketConnected) return;

		if (!isTyping) {
			socket.emit("typing", selectedChat._id);
		}

		lastTypingTime = new Date().getTime();
		const timerLength = 3000;

		setTimeout(() => {
			const timeNow = new Date().getTime();
			const timeDiff = timeNow - lastTypingTime;

			if (timeDiff > timerLength) {
				socket.emit("stop typing", selectedChat._id);
			}
		}, timerLength);
	};

	return (
		<form
			className="relative w-full flex items-center gap-4 h-[7vh] px-4 bg-richblack-800 border-t border-richblack-600 text-white mt-6"
			onSubmit={(e) => e.preventDefault()}
		>
			{/* File Upload (coming soon) */}
			<button
				type="button"
				onClick={() => mediaFile.current.click()}
				className="p-2 rounded-md hover:bg-richblack-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
				title="Open File"
			>
				<FaFolderOpen size={20} />
			</button>
			<button
				type="button"
				onClick={() => setShowEmojiPicker(v => !v)}
				className="p-2 rounded-md hover:bg-richblack-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
				title="Emoji"
			>
				<FaSmile size={20} />
			</button>
			{showEmojiPicker && (
				<div className="absolute bottom-full mb-2 left-0 z-50">
					<Picker onEmojiClick={(emojiData) => { setMessage(m => m + emojiData.emoji); setShowEmojiPicker(false); }} />
				</div>
			)}

			{/* Message Input */}
			<input
				type="text"
				className="flex-1 bg-richblack-700 px-4 py-2 rounded-full placeholder:text-richblack-400 text-richblack-5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
				placeholder="Type a message..."
				value={newMessage}
				onChange={handleTyping}
			/>

			{/* Send Button or Loader */}
			{!isSendLoading && newMessage.trim() && (
				<button
					type="button"
					onClick={handleSendMessage}
					className="p-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
					title="Send Message"
				>
					<FaPaperPlane size={18} />
				</button>
			)}
			{isSendLoading && (
				<div className="p-2">
					<LuLoader className="animate-spin text-yellow-400" size={18} />
				</div>
			)}
		</form>
	);
};

export default MessageSend;

import React, { useEffect, useRef, useState } from "react";
import { FaFolderOpen, FaPaperPlane } from "react-icons/fa";
import { LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import { setSendLoading, setTyping } from "../../redux/slices/conditionSlice";
import { addNewMessage, addNewMessageId } from "../../redux/slices/messageSlice";
import socket from "../../socket/socket";

let lastTypingTime;

const MessageSend = ({ chatId }) => {
	const mediaFile = useRef();
	const [newMessage, setMessage] = useState("");

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
			className="w-full flex items-center gap-2 h-[7vh] px-3 bg-slate-800 text-white"
			onSubmit={(e) => e.preventDefault()}
		>
			{/* File Upload (coming soon) */}
			<label htmlFor="media" className="cursor-pointer">
				<FaFolderOpen
					title="Open File"
					size={22}
					className="active:scale-75 hover:text-green-400"
				/>
			</label>
			<input
				ref={mediaFile}
				type="file"
				name="image"
				accept="image/png, image/jpg, image/gif, image/jpeg"
				id="media"
				className="hidden"
				onChange={handleMediaBox}
			/>

			{/* Message Input */}
			<input
				type="text"
				className="outline-none p-2 w-full bg-transparent placeholder:text-slate-400"
				placeholder="Type a message..."
				value={newMessage}
				onChange={handleTyping}
			/>

			{/* Send Button or Loader */}
			<span className="flex justify-center items-center">
				{newMessage.trim() && !isSendLoading && (
					<button
						className="outline-none p-2 border-slate-500 border-l"
						onClick={handleSendMessage}
					>
						<FaPaperPlane
							title="Send"
							size={18}
							className="active:scale-75 hover:text-green-400"
						/>
					</button>
				)}
				{isSendLoading && (
					<div className="p-2 border-slate-500 border-l">
						<LuLoader
							title="Sending..."
							fontSize={18}
							className="animate-spin"
						/>
					</div>
				)}
			</span>
		</form>
	);
};

export default MessageSend;

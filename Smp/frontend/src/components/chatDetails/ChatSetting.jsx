import React, { useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { VscError } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
	setChatDetailsBox,
	setLoading,
} from "../../redux/slices/conditionSlice";
import { addAllMessages } from "../../redux/slices/messageSlice";
import { deleteSelectedChat } from "../../redux/slices/myChatSlice";
import socket from "../../socket/socket";
import { MdOutlineClearAll, MdDeleteForever } from 'react-icons/md';

const ChatSetting = () => {
	const dispatch = useDispatch();
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [isConfirm, setConfirm] = useState("");

	const handleClearChat = () => {
		if (
			authUserId === selectedChat?.groupAdmin?._id ||
			!selectedChat?.isGroupChat
		) {
			setConfirm("clear-chat");
		} else {
			toast.warn("You're not admin");
		}
	};

	const handleDeleteGroup = () => {
		if (authUserId === selectedChat?.groupAdmin?._id) {
			setConfirm("delete-group");
		} else {
			toast.warn("You're not admin");
		}
	};

	const handleDeleteChat = () => {
		if (!selectedChat?.isGroupChat) {
			setConfirm("delete-chat");
		}
	};

	const handleClearChatCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(
			`${import.meta.env.VITE_BACKEND_URL}/api/message/clearChat/${
				selectedChat?._id
			}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		)
			.then((res) => res.json())
			.then((json) => {
				setConfirm("");
				dispatch(setLoading(false));
				if (json?.message === "success") {
					dispatch(addAllMessages([]));
					socket.emit("clear chat", selectedChat._id);
					toast.success("Cleared all messages");
				} else {
					toast.error("Failed to clear chat");
				}
			})
			.catch((err) => {
				console.log(err);
				setConfirm("");
				dispatch(setLoading(false));
				toast.error("Failed to clear chat");
			});
	};

	const handleDeleteChatCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(
			`${import.meta.env.VITE_BACKEND_URL}/api/chat/deleteGroup/${
				selectedChat?._id
			}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		)
			.then((res) => res.json())
			.then((json) => {
				dispatch(setLoading(false));
				if (json?.message === "success") {
					let chat = selectedChat;
					dispatch(setChatDetailsBox(false));
					dispatch(addAllMessages([]));
					dispatch(deleteSelectedChat(chat._id));
					socket.emit("delete chat", chat, authUserId);
					toast.success("Chat deleted successfully");
				} else {
					toast.error("Failed to delete chat");
				}
			})
			.catch((err) => {
				console.log(err);
				dispatch(setLoading(false));
				toast.error("Failed to delete chat");
			});
	};

	return (
		<div className="flex flex-col h-full bg-richblack-800 rounded-lg shadow-md overflow-auto p-6">
			{/* Header */}
			<h1 className="text-xl font-bold text-yellow-400 text-center mb-6">Settings</h1>

			{/* Clear Chat */}
			<button
				onClick={handleClearChat}
				className="flex items-center justify-between w-full p-4 bg-richblack-700 border border-richblack-600 rounded-lg hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition mb-4"
				title={selectedChat?.isGroupChat ? 'Admin only' : 'Clear Chat'}
			>
				<span>Clear Chat</span>
				<MdOutlineClearAll size={20} className="text-yellow-400" />
			</button>

			{/* Delete Option */}
			{selectedChat?.isGroupChat ? (
				<button
					onClick={handleDeleteGroup}
					className="flex items-center justify-between w-full p-4 bg-richblack-700 border border-richblack-600 rounded-lg hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
					title="Admin only"
				>
					<span>Delete Group</span>
					<MdDeleteForever size={20} className="text-red-400" />
				</button>
			) : (
				<button
					onClick={handleDeleteChat}
					className="flex items-center justify-between w-full p-4 bg-richblack-700 border border-richblack-600 rounded-lg hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
					title="Delete Chat"
				>
					<span>Delete Chat</span>
					<MdDeleteForever size={20} className="text-red-400" />
				</button>
			)}

			{/* Confirmation UI */}
			{isConfirm && (
				<div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
					<div className="bg-richblack-800 border border-red-600 rounded-lg p-6 w-full max-w-xs shadow-xl">
						<div className="flex flex-col items-center gap-4 text-white">
							<span className="font-semibold text-lg">
								{isConfirm === 'clear-chat' ? 'Confirm Clear Chat?' : isConfirm === 'delete-group' ? 'Confirm Delete Group?' : 'Confirm Delete Chat?'}
							</span>
							<div className="flex gap-4 w-full">
								<button
									onClick={() => setConfirm('')}
									className="flex-1 py-2 px-4 rounded-full bg-richblack-700 text-white hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
									title="Cancel"
								>
									<VscError size={20} />
								</button>
								<button
									onClick={isConfirm === 'clear-chat' ? handleClearChatCall : handleDeleteChatCall}
									className="flex-1 py-2 px-4 rounded-full bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
									title="Confirm"
								>
									<IoCheckmarkCircleOutline size={20} />
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatSetting;

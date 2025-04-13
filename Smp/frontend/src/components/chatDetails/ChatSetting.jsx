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
		<div className="flex flex-col p-4 gap-4 text-yellow-50 bg-richblack-900 rounded-md overflow-auto scroll-style h-full">
			<h1 className="font-semibold text-lg text-center">Settings</h1>

			{/* Clear Chat */}
			<div
				onClick={handleClearChat}
				className="w-full px-4 py-2 border border-richblack-600 rounded-lg flex justify-between items-center cursor-pointer transition-all hover:bg-richblack-700"
			>
				<span>Clear Chat</span>
				<CiCircleInfo
					fontSize={18}
					title={
						selectedChat?.isGroupChat
							? "Admin access only"
							: "Clear Chat"
					}
				/>
			</div>

			{/* Delete Option */}
			{selectedChat?.isGroupChat ? (
				<div
					onClick={handleDeleteGroup}
					className="w-full px-4 py-2 border border-richblack-600 rounded-lg flex justify-between items-center cursor-pointer transition-all hover:bg-richblack-700"
				>
					<span>Delete Group</span>
					<CiCircleInfo fontSize={18} title="Admin access only" />
				</div>
			) : (
				<div
					onClick={handleDeleteChat}
					className="w-full px-4 py-2 border border-richblack-600 rounded-lg flex justify-between items-center cursor-pointer transition-all hover:bg-richblack-700"
				>
					<span>Delete Chat</span>
					<CiCircleInfo fontSize={18} title="Delete Chat" />
				</div>
			)}

			{/* Confirmation UI */}
			{isConfirm && (
				<div className="fixed bottom-2 right-2 w-[calc(100%-1rem)] sm:w-[380px] bg-richblack-800 border border-richblack-600 p-4 rounded-lg shadow-lg z-20">
					<div
						className={`flex justify-between items-center ${
							isConfirm === "clear-chat"
								? "text-blue-200"
								: "text-red-300"
						}`}
					>
						<span className="text-sm font-semibold">
							{isConfirm === "clear-chat"
								? "Clear chat confirmation?"
								: isConfirm === "delete-group"
								? "Delete group confirmation?"
								: "Delete chat confirmation?"}
						</span>
						<div className="flex gap-3">
							<button
								onClick={() => setConfirm("")}
								className="border border-richblack-600 p-1.5 rounded-md hover:bg-richblack-700"
								title="Cancel"
							>
								<VscError fontSize={18} />
							</button>
							<button
								onClick={
									isConfirm === "clear-chat"
										? handleClearChatCall
										: handleDeleteChatCall
								}
								className="border border-richblack-600 p-1.5 rounded-md hover:bg-richblack-700"
								title="Confirm"
							>
								<IoCheckmarkCircleOutline fontSize={18} />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatSetting;

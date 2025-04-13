import React, { useEffect } from "react";
import { FaPenAlt } from "react-icons/fa";
import { VscCheckAll } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import {
	addMyChat,
	addSelectedChat,
} from "../../redux/slices/myChatSlice";
import {
	setChatLoading,
	setGroupChatBox,
} from "../../redux/slices/conditionSlice";
import ChatShimmer from "../loading/ChatShimmer";
import getChatName, { getChatImage } from "../../utils/getChatName";
import {
	SimpleDateAndTime,
	SimpleTime,
} from "../../utils/formateDateTime";

const MyChat = () => {
	const dispatch = useDispatch();
	const myChat = useSelector((store) => store.myChat.chat);
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const isChatLoading = useSelector((store) => store?.condition?.isChatLoading);
	const newMessageId = useSelector((store) => store?.message?.newMessageId);
	const isGroupChatId = useSelector((store) => store.condition.isGroupChatId);

	useEffect(() => {
		const getMyChat = () => {
			dispatch(setChatLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			})
				.then((res) => res.json())
				.then((json) => {
					dispatch(addMyChat(json?.data || []));
					dispatch(setChatLoading(false));
				})
				.catch((err) => {
					console.log(err);
					dispatch(setChatLoading(false));
				});
		};
		getMyChat();
	}, [newMessageId, isGroupChatId]);

	return (
		<>
			{/* Header */}
			<div className="p-4 w-full h-[7vh] flex justify-between items-center bg-richblack-800 text-yellow-50 font-semibold border-b border-richblack-600">
				<h1 className="text-lg whitespace-nowrap">My Chat</h1>
				<div
					className="flex items-center gap-2 border border-richblack-600 px-3 py-1 rounded-md cursor-pointer hover:bg-richblack-700 active:bg-richblack-600 transition"
					onClick={() => dispatch(setGroupChatBox())}
					title="Create New Group"
				>
					<span className="whitespace-nowrap">New Group</span>
					<FaPenAlt />
				</div>
			</div>

			{/* Chat List */}
			<div className="flex flex-col w-full px-4 py-2 gap-2 overflow-y-auto scroll-style h-[73vh]">
				{myChat.length === 0 && isChatLoading ? (
					<ChatShimmer />
				) : myChat.length === 0 ? (
					<div className="flex justify-center items-center h-full text-richblack-300">
						<h1 className="text-base font-semibold">
							Start a new conversation.
						</h1>
					</div>
				) : (
					myChat.map((chat) => (
						<div
							key={chat?._id}
							onClick={() => dispatch(addSelectedChat(chat))}
							className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border border-richblack-600
								${
									selectedChat?._id === chat?._id
										? "bg-yellow-50 text-black"
										: "bg-richblack-700 text-white hover:bg-richblack-600"
								}`}
						>
							<img
								src={getChatImage(chat, authUserId)}
								alt="user"
								className="h-12 w-12 rounded-full object-cover"
							/>
							<div className="flex-1">
								<div className="flex justify-between items-center">
									<span className="font-semibold capitalize truncate">
										{getChatName(chat, authUserId)}
									</span>
									<span className="text-xs font-light text-richblack-300">
										{chat?.latestMessage &&
											SimpleTime(chat.latestMessage?.createdAt)}
									</span>
								</div>
								<div className="flex items-center gap-1 text-sm font-light text-richblack-200 truncate">
									{chat?.latestMessage ? (
										<>
											{chat?.latestMessage?.sender?._id === authUserId && (
												<VscCheckAll fontSize={14} />
											)}
											<span className="truncate">
												{chat.latestMessage?.message}
											</span>
										</>
									) : (
										<span>{SimpleDateAndTime(chat.createdAt)}</span>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</>
	);
};

export default MyChat;

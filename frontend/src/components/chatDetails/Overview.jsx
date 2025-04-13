import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import getChatName, { getChatImage } from "../../utils/getChatName";
import { SimpleDateAndTime } from "../../utils/formateDateTime";
import { CiCircleInfo } from "react-icons/ci";
import { toast } from "react-toastify";
import { RxUpdate } from "react-icons/rx";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { setLoading } from "../../redux/slices/conditionSlice";

const Overview = () => {
	const dispatch = useDispatch();
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);

	const [changeNameBox, setChangeNameBox] = useState(false);
	const [changeName, setChangeName] = useState(selectedChat?.chatName);

	const handleShowNameChange = () => {
		if (authUserId === selectedChat?.groupAdmin?._id) {
			setChangeNameBox(!changeNameBox);
			setChangeName(selectedChat?.chatName);
		} else {
			toast.warn("You're not admin");
		}
	};

	const handleChangeName = () => {
		setChangeNameBox(false);
		if (selectedChat?.chatName === changeName.trim()) {
			toast.warn("Name already taken");
			return;
		} else if (!changeName.trim()) {
			toast.warn("Please enter group name");
			return;
		}
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");

		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/rename`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				name: changeName.trim(),
				chatId: selectedChat?._id,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				dispatch(addSelectedChat(json?.data));
				dispatch(setLoading(false));
				toast.success("Group name changed");
			})
			.catch((err) => {
				console.log(err);
				toast.error(err.message);
				dispatch(setLoading(false));
			});
	};

	return (
		<div className="text-white px-6 py-4 flex flex-col gap-4">
			{/* Avatar and Title */}
			<div className="flex flex-col items-center justify-center gap-2">
				<img
					src={getChatImage(selectedChat, authUserId)}
					alt="chat"
					className="h-16 w-16 rounded-full object-cover border border-slate-600"
				/>
				<div className="flex items-center gap-2 text-lg font-semibold">
					<span>{getChatName(selectedChat, authUserId)}</span>
					{selectedChat?.isGroupChat && (
						<CiCircleInfo
							fontSize={18}
							title="Change Name"
							onClick={handleShowNameChange}
							className="cursor-pointer text-blue-300 hover:text-white"
						/>
					)}
				</div>
			</div>

			{/* Rename Group Section */}
			{changeNameBox && (
				<div className="space-y-2">
					<h2 className="text-sm font-medium">Rename Group Chat:</h2>
					<div className="flex gap-2">
						<input
							type="text"
							value={changeName}
							onChange={(e) => setChangeName(e.target.value)}
							className="w-full px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						<button
							onClick={handleChangeName}
							title="Change Name"
							className="p-2 rounded-md border border-slate-600 hover:bg-slate-700 transition-all"
						>
							<RxUpdate fontSize={18} />
						</button>
					</div>
				</div>
			)}

			{/* Divider */}
			<div className="border-t border-slate-800" />

			{/* Chat Meta Info */}
			<div className="space-y-2 text-sm">
				<div>
					<h3 className="text-slate-400">Created</h3>
					<p className="text-white/70">
						{SimpleDateAndTime(selectedChat?.createdAt)}
					</p>
				</div>
				<div>
					<h3 className="text-slate-400">Last Updated</h3>
					<p className="text-white/70">
						{SimpleDateAndTime(selectedChat?.updatedAt)}
					</p>
				</div>
				<div>
					<h3 className="text-slate-400">Last Message</h3>
					<p className="text-white/70">
						{SimpleDateAndTime(selectedChat?.latestMessage?.updatedAt)}
					</p>
				</div>
			</div>
		</div>
	);
};

export default Overview;

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	IoCheckmarkCircleOutline,
	IoPersonAddOutline,
	IoPersonRemoveOutline,
} from "react-icons/io5";
import { VscError } from "react-icons/vsc";
import { CiCircleInfo } from "react-icons/ci";
import { toast } from "react-toastify";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { setLoading } from "../../redux/slices/conditionSlice";

const MemberRemove = ({ setMemberAddBox }) => {
	const dispatch = useDispatch();
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [removeUserName, setRemoveUserName] = useState("");
	const [removeUserId, setRemoveUserId] = useState("");

	const handleRemoveUser = (userId, userName) => {
		setRemoveUserId(userId);
		setRemoveUserName(userName);
	};

	const handleRemoveUserCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/groupremove`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				userId: removeUserId,
				chatId: selectedChat?._id,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				toast.success(`${removeUserName} removed successfully`);
				setRemoveUserId("");
				setRemoveUserName("");
				dispatch(addSelectedChat(json?.data));
				dispatch(setLoading(false));
			})
			.catch((err) => {
				console.log(err);
				toast.error(err.message);
				dispatch(setLoading(false));
			});
	};

	return (
		<div className="relative flex flex-col h-full bg-richblack-800 rounded-lg shadow-md overflow-hidden">
			{/* Member List */}
			<div className="flex-1 p-6 space-y-3 overflow-auto scroll-style">
				{selectedChat?.users?.map(user => (
					<div
						key={user._id}
						className="flex items-center justify-between p-3 bg-richblack-700 border border-richblack-600 rounded-lg hover:bg-richblack-600 transition"
					>
						<div className="flex items-center gap-4">
							<img src={user.image} alt={`${user.firstName} ${user.lastName}`} className="h-10 w-10 rounded-full object-cover border-2 border-transparent" />
							<div>
								<p className="font-medium text-white capitalize">{user.firstName} {user.lastName}</p>
								{user._id === selectedChat.groupAdmin._id && (
									<p className="text-xs text-yellow-300 font-light">Admin</p>
								)}
							</div>
						</div>
						<div>
							{authUserId === selectedChat.groupAdmin._id && user._id !== selectedChat.groupAdmin._id && (
								<button
									onClick={() => handleRemoveUser(user._id, user.firstName)}
									className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
									title="Remove Member"
								>
									<IoPersonRemoveOutline size={18} title="Remove Member" />
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Removal Confirmation Modal */}
			{removeUserName && (
				<div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="bg-richblack-800 border border-red-600 rounded-xl p-6 w-full max-w-sm shadow-lg">
						<h3 className="text-lg font-semibold text-red-400 mb-4 text-center">
							Remove {removeUserName}?
						</h3>
						<div className="flex justify-center gap-4">
							<button
								onClick={() => { setRemoveUserName(''); setRemoveUserId(''); }}
								className="flex-1 py-2 px-4 rounded-full bg-richblack-700 text-white hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
							>
								Cancel
							</button>
							<button
								onClick={handleRemoveUserCall}
								className="flex-1 py-2 px-4 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MemberRemove;

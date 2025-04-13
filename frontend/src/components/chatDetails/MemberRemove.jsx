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
		<div className="p-4">
			{selectedChat?.groupAdmin?._id === authUserId && (
				<button
					className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition-all"
					onClick={() => setMemberAddBox(true)}
				>
					<IoPersonAddOutline fontSize={18} />
					<span className="text-sm font-medium">Add Members</span>
				</button>
			)}

			<div className="my-4 border-b border-slate-700" />

			<div className="space-y-2">
				{selectedChat?.users?.map((user) => (
					<div
						key={user?._id}
						className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-600 text-white bg-slate-900 hover:bg-slate-800 transition-all"
					>
						<div className="flex items-center gap-3">
							<img
								src={user?.image}
								alt="profile"
								className="h-10 w-10 rounded-full object-cover"
							/>
							<div>
								<p className="capitalize font-medium">
									{user?.firstName} {user?.lastName}
								</p>
								{user?._id === selectedChat?.groupAdmin?._id && (
									<p className="text-xs text-blue-300 font-light">
										Admin
									</p>
								)}
							</div>
						</div>

						{user?._id !== selectedChat?.groupAdmin?._id && (
							<>
								{authUserId === selectedChat?.groupAdmin?._id ? (
									<button
										onClick={() =>
											handleRemoveUser(
												user?._id,
												user?.firstName
											)
										}
										className="p-2 rounded-md border border-red-400 text-red-300 hover:bg-red-600/10 transition-all"
										title="Remove Member"
									>
										<IoPersonRemoveOutline />
									</button>
								) : (
									<CiCircleInfo
										title="Only Admin can remove"
										className="text-slate-400 hover:text-white cursor-pointer"
										fontSize={22}
										onClick={() =>
											toast.warn("You're not the admin")
										}
									/>
								)}
							</>
						)}
					</div>
				))}
			</div>

			{removeUserName && (
				<div className="fixed bottom-2 w-full px-4">
					<div className="flex items-center justify-between bg-red-900 border border-red-600 text-white rounded-md px-3 py-2">
						<p className="text-sm font-medium">
							Confirm removal of '{removeUserName}'?
						</p>
						<div className="flex gap-2">
							<button
								onClick={() => {
									setRemoveUserName("");
									setRemoveUserId("");
								}}
								className="p-1.5 rounded-md border border-white hover:bg-white/10 transition"
							>
								<VscError fontSize={18} />
							</button>
							<button
								onClick={handleRemoveUserCall}
								className="p-1.5 rounded-md border border-white hover:bg-white/10 transition"
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

export default MemberRemove;

import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
	setChatLoading,
	setLoading,
	setUserSearchBox,
} from "../../redux/slices/conditionSlice";
import { toast } from "react-toastify";
import ChatShimmer from "../loading/ChatShimmer";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { SimpleDateAndTime } from "../../utils/formateDateTime";
import socket from "../../socket/socket";

const UserSearch = () => {
	const dispatch = useDispatch();
	const isChatLoading = useSelector((store) => store?.condition?.isChatLoading);
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inputUserName, setInputUserName] = useState("");
	const authUserId = useSelector((store) => store?.auth?._id);

	useEffect(() => {
		const getAllUsers = () => {
			dispatch(setChatLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/users`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			})
				.then((res) => res.json())
				.then((json) => {
					setUsers(json.data || []);
					setSelectedUsers(json.data || []);
					dispatch(setChatLoading(false));
				})
				.catch((err) => {
					console.log(err);
					dispatch(setChatLoading(false));
				});
		};
		getAllUsers();
	}, []);

	useEffect(() => {
		setSelectedUsers(
			users.filter((user) =>
				[`${user.firstName} ${user.lastName}`, user.email]
					.join(" ")
					.toLowerCase()
					.includes(inputUserName?.toLowerCase())
			)
		);
	}, [inputUserName]);

	const handleCreateChat = (userId) => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");

		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ userId }),
		})
			.then((res) => res.json())
			.then((json) => {
				dispatch(addSelectedChat(json?.data));
				socket.emit("chat created", json?.data, authUserId);
				toast.success("Chat created!");
				dispatch(setLoading(false));
				dispatch(setUserSearchBox());
			})
			.catch((err) => {
				console.error(err);
				toast.error("Failed to create chat.");
				dispatch(setLoading(false));
			});
	};

	return (
		<>
			{/* Header */}
			<div className="p-4 w-full h-[7vh] flex justify-between items-center bg-richblack-800 text-yellow-50 font-semibold border-b border-richblack-600">
				<h1 className="text-lg">New Chat</h1>
				<div className="w-2/3 flex items-center gap-2">
					<input
						id="search"
						type="text"
						placeholder="Search users..."
						className="w-full bg-richblack-700 text-white px-3 py-1.5 border border-richblack-600 rounded-md outline-none placeholder:text-richblack-300 focus:border-yellow-50 transition"
						onChange={(e) => setInputUserName(e.target.value)}
					/>
					<label htmlFor="search" className="text-yellow-50 cursor-pointer">
						<FaSearch />
					</label>
				</div>
			</div>

			{/* User List */}
			<div className="flex flex-col w-full px-4 gap-2 py-2 overflow-y-auto scroll-style h-[73vh]">
				{selectedUsers.length === 0 && isChatLoading ? (
					<ChatShimmer />
				) : selectedUsers.length === 0 ? (
					<div className="w-full h-full flex justify-center items-center text-richblack-300">
						<h1 className="text-base font-semibold">No users found.</h1>
					</div>
				) : (
					selectedUsers.map((user) => (
						<div
							key={user._id}
							onClick={() => handleCreateChat(user._id)}
							className="w-full flex items-center gap-3 p-3 border border-richblack-600 rounded-lg cursor-pointer transition-all bg-richblack-700 text-white hover:bg-richblack-600"
						>
							<img
								src={user?.image}
								alt="user"
								className="h-12 w-12 rounded-full object-cover"
							/>
							<div className="flex-1">
								<div className="font-semibold capitalize truncate">
									{user?.firstName} {user?.lastName}
								</div>
								<div className="text-xs font-light text-richblack-300">
									{SimpleDateAndTime(user?.createdAt)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</>
	);
};

export default UserSearch;

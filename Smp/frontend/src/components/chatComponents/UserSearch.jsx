import React, { useEffect, useState } from "react";
import { FaSearch, FaTimes, FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
	setChatLoading,
	setLoading,
	setUserSearchBox,
} from "../../redux/slices/conditionSlice";
import { toast } from "react-toastify";
import ChatShimmer from "../loading/ChatShimmer";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
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
			users.filter((user) => {
				const searchable = `${user.firstName} ${user.lastName} ${user.email} ${user.regNo}`;
				return searchable
					.toLowerCase()
					.includes(inputUserName.toLowerCase());
			})
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
			<div className="relative p-4 w-full h-[7vh] flex items-center bg-richblack-900 text-yellow-400 font-semibold border-b border-richblack-600 shadow">
				{/* Back Button */}
				<button
					onClick={() => dispatch(setUserSearchBox())}
					className="p-2 rounded-full hover:bg-richblack-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
					title="Back"
				>
					<FaArrowLeft size={20} className="text-white" />
				</button>
			</div>
			{/* Search Input Row */}
			<div className="px-4 py-3 bg-richblack-900 border-b border-richblack-600">
				<div className="relative w-full max-w-md mx-auto">
					<FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-richblack-400" />
					<input
						id="search"
						type="text"
						placeholder="Search users..."
						className="w-full bg-richblack-700 text-richblack-5 placeholder:text-richblack-400 pl-12 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
						onChange={(e) => setInputUserName(e.target.value)}
					/>
				</div>
			</div>

			{/* User List */}
			<div className="flex flex-col w-full px-4 py-3 space-y-3 overflow-y-auto scroll-style h-[73vh]">
				{selectedUsers.length === 0 && isChatLoading ? (
					<ChatShimmer />
				) : selectedUsers.length === 0 ? (
					<div className="w-full h-full flex justify-center items-center text-richblack-300">
						<h1 className="text-base font-semibold">No users found.</h1>
					</div>
				) : (
					selectedUsers.map((user) => (
						<button
							key={user._id}
							onClick={() => handleCreateChat(user._id)}
							className="w-full flex items-center gap-3 p-4 border border-richblack-600 rounded-lg bg-richblack-700 text-white hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
						>
							<img
								src={user?.image}
								alt="user"
								className="h-12 w-12 rounded-full object-cover border-2 border-transparent"
							/>
							<div className="flex-1">
								<div className="font-semibold text-lg capitalize truncate">
									{user?.firstName} {user?.lastName}
								</div>
								<div className="text-sm text-richblack-300">
									Reg No: {user.regNo} | Role: {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
								</div>
							</div>
						</button>
					))
				)}
			</div>
		</>
	);
};

export default UserSearch;

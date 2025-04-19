import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { setChatLoading, setLoading } from "../../redux/slices/conditionSlice";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { ChatShimmerSmall } from "../loading/ChatShimmer";
import { IoCheckmarkCircleOutline, IoPersonAddOutline } from "react-icons/io5";
import { VscError } from "react-icons/vsc";

const MemberAdd = ({ setMemberAddBox }) => {
	const dispatch = useDispatch();
	const isChatLoading = useSelector((store) => store?.condition?.isChatLoading);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inputUserName, setInputUserName] = useState("");
	const [addUserName, setAddUserName] = useState("");
	const [addUserId, setAddUserId] = useState("");

	// Fetch all users
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
				return (
					user.firstName.toLowerCase().includes(inputUserName?.toLowerCase()) ||
					user.lastName.toLowerCase().includes(inputUserName?.toLowerCase()) ||
					user.email.toLowerCase().includes(inputUserName?.toLowerCase())
				);
			})
		);
	}, [inputUserName]);

	const handleAddUser = (userId, userName) => {
		if (selectedChat?.users?.find((user) => user?._id === userId)) {
			toast.warn(`${userName} is already added`);
			setAddUserId("");
			setAddUserName("");
			return;
		}
		setAddUserId(userId);
		setAddUserName(userName);
	};

	const handleAddUserCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/groupadd`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				userId: addUserId,
				chatId: selectedChat?._id,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				toast.success(`${addUserName} Added successfully`);
				setAddUserId("");
				setAddUserName("");
				dispatch(addSelectedChat(json?.data));
				dispatch(setLoading(false));
				setMemberAddBox(false);
			})
			.catch((err) => {
				console.log(err);
				toast.error(err.message);
				dispatch(setLoading(false));
			});
	};

	return (
		<div className="relative p-6 text-white bg-richblack-800 rounded-lg shadow-inner overflow-auto h-full scroll-style">
			<h2 className="text-lg font-semibold text-center mb-4">Add Member</h2>

			{/* Back Button */}
			<button
				onClick={() => setMemberAddBox(false)}
				className="absolute top-4 left-4 p-2 bg-richblack-700 rounded-full hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
				title="Back"
			>
				<FaArrowLeft size={18} className="text-white" />
			</button>

			{/* Search */}
			<div className="relative mb-6">
				<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" title="Search Users" />
				<input
					id="search"
					type="text"
					placeholder="Search users..."
					className="w-full bg-richblack-700 text-white placeholder:text-richblack-400 pl-10 pr-4 py-2 rounded-full border border-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
					onChange={(e) => setInputUserName(e.target.value)}
				/>
			</div>

			{/* User List */}
			{selectedUsers.length === 0 && isChatLoading ? (
				<ChatShimmerSmall />
			) : selectedUsers.length === 0 ? (
				<div className="text-center text-sm text-richblack-200">No users found</div>
			) : (
				<div className="flex flex-col space-y-2 max-h-[40vh] overflow-auto scroll-style">
					{selectedUsers.map((user) => (
						<button
							key={user._id}
							onClick={() => handleAddUser(user._id, user.firstName)}
							className="w-full flex items-center gap-3 p-4 bg-richblack-700 border border-richblack-600 rounded-lg text-white hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
						>
							<img
								className="h-10 w-10 rounded-full object-cover border-2 border-transparent"
								src={user.image}
								alt={`${user.firstName} ${user.lastName}`}
							/>
							<div className="flex-1 capitalize truncate">
								{user.firstName} {user.lastName}
							</div>
							<IoPersonAddOutline size={20} className="text-yellow-400" title="Add Member" />
						</button>
					))}
				</div>
			)}

			{/* Confirmation Modal */}
			{addUserName && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
					<div className="bg-richblack-800 border border-yellow-400 rounded-lg p-6 w-full max-w-xs shadow-xl">
						<h2 className="text-lg font-bold mb-4 text-center text-white">
							Add '{addUserName}' to group?
						</h2>
						<div className="flex justify-center gap-4">
							<button
								onClick={() => { setAddUserName(''); setAddUserId(''); }}
								className="flex-1 py-2 px-4 rounded-full bg-richblack-700 text-white border border-richblack-600 hover:bg-richblack-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
								title="Cancel"
							>
								Cancel
							</button>
							<button
								onClick={handleAddUserCall}
								className="flex-1 py-2 px-4 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
								title="Confirm Add Member"
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MemberAdd;

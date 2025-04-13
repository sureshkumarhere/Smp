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
		<div className="relative p-4 text-yellow-50 bg-richblack-900 rounded-md overflow-auto h-full scroll-style">
			<h2 className="text-lg font-semibold text-center mb-4">Add Member</h2>

			{/* Back Button */}
			<div
				onClick={() => setMemberAddBox(false)}
				className="bg-black/20 hover:bg-black/50 h-8 w-8 rounded-md flex items-center justify-center absolute top-4 left-4 cursor-pointer"
			>
				<FaArrowLeft fontSize={14} />
			</div>

			{/* Search */}
			<div className="flex items-center gap-2 mb-4 justify-center">
				<input
					id="search"
					type="text"
					placeholder="Search users..."
					className="w-2/3 border border-richblack-600 py-1 px-3 rounded-md outline-none bg-transparent placeholder:text-sm"
					onChange={(e) => setInputUserName(e.target.value)}
				/>
				<label htmlFor="search" className="cursor-pointer">
					<FaSearch title="Search Users" />
				</label>
			</div>

			{/* User List */}
			{selectedUsers.length === 0 && isChatLoading ? (
				<ChatShimmerSmall />
			) : selectedUsers.length === 0 ? (
				<div className="text-center text-sm text-richblack-200">No users found</div>
			) : (
				<div className="flex flex-col gap-2">
					{selectedUsers.map((user) => (
						<div
							key={user._id}
							className="w-full border border-richblack-600 rounded-lg p-2 flex items-center gap-3 hover:bg-richblack-800 transition-all cursor-pointer"
						>
							<img
								className="h-10 w-10 rounded-full object-cover"
								src={user.image}
								alt="img"
							/>
							<div className="flex-1 capitalize truncate">
								{user.firstName} {user.lastName}
							</div>
							<div
								title="Add User"
								className="border border-richblack-600 p-2 rounded-md hover:bg-richblack-700 transition-all"
								onClick={() => handleAddUser(user._id, user.firstName)}
							>
								<IoPersonAddOutline />
							</div>
						</div>
					))}
				</div>
			)}

			{/* Confirmation Modal */}
			{addUserName && (
				<div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center animate-fadeIn">
					<div className="bg-richblack-800 border border-richblack-600 rounded-lg p-6 w-[90%] max-w-sm shadow-xl">
						<h2 className="text-lg font-semibold mb-4 text-center text-yellow-50">
							Add '{addUserName}' to group?
						</h2>
						<div className="flex justify-center gap-4">
							<button
								onClick={() => {
									setAddUserName("");
									setAddUserId("");
								}}
								className="px-4 py-2 border border-richblack-600 rounded-md hover:bg-richblack-700 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleAddUserCall}
								className="px-4 py-2 bg-yellow-50 text-richblack-900 font-semibold rounded-md hover:bg-yellow-100 transition-all"
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

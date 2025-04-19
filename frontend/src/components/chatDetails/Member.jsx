import React, { useState } from "react";
import { HiOutlineUsers } from "react-icons/hi2";
import MemberAdd from "./MemberAdd";
import MemberRemove from "./MemberRemove";
import { useSelector } from "react-redux";

const Member = () => {
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [memberAddBox, setMemberAddBox] = useState(false);

	return (
		<div className="flex flex-col h-full bg-richblack-800 rounded-lg shadow-md overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 bg-richblack-700 border-b border-richblack-600">
				<h2 className="text-xl font-semibold text-yellow-400">Members ({selectedChat?.users?.length})</h2>
				<button
					onClick={() => setMemberAddBox(!memberAddBox)}
					className="flex items-center gap-2 px-3 py-1 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
					title={memberAddBox ? 'Close Add Member' : 'Add Member'}
				>
					<HiOutlineUsers size={18} />
					<span className="text-sm">{memberAddBox ? 'Close' : 'Add'}</span>
				</button>
			</div>
			{/* Content */}
			<div className="flex-1 p-6 overflow-auto scroll-style">
				{memberAddBox ? (
					<MemberAdd setMemberAddBox={setMemberAddBox} />
				) : (
					<MemberRemove setMemberAddBox={setMemberAddBox} />
				)}
			</div>
		</div>
	);
};

export default Member;
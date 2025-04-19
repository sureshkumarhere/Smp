import React from "react";
import { FiMessageSquare } from "react-icons/fi";

const ChatNotSelected = () => {
	return (
		<div className="h-full w-full flex items-center justify-center bg-richblack-900">
			<div className="flex flex-col items-center gap-4 px-8 py-12 bg-richblack-800 border border-richblack-700 rounded-2xl shadow-lg">
				<FiMessageSquare size={48} className="text-yellow-400" />
				<h1 className="text-2xl font-semibold text-richblack-100">
					No Chat Selected
				</h1>
				<p className="text-sm text-richblack-300">
					Select a chat to start messaging
				</p>
			</div>
		</div>
	);
};

export default ChatNotSelected;

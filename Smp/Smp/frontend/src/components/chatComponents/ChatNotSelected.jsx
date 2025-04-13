import React from "react";

const ChatNotSelected = () => {
	return (
		<div className="h-full w-full flex items-center justify-center">
			<div className="text-center px-6 py-10 rounded-lg bg-richblack-800 border border-richblack-700 shadow-md">
				<h1 className="text-xl sm:text-2xl font-semibold text-richblack-100">
					No Chat Selected
				</h1>
				<p className="text-sm text-richblack-300 mt-2">
					Select a chat to start messaging
				</p>
			</div>
		</div>
	);
};

export default ChatNotSelected;

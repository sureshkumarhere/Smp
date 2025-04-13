import React from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const MessageLoading = () => {
	return (
		<div className="flex items-center justify-center w-full h-[66vh] overflow-hidden text-white">
			<AiOutlineLoading3Quarters className="animate-spin text-2xl opacity-80" />
		</div>
	);
};

export default MessageLoading;

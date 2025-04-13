import React from "react";

const shimmerBase =
	"bg-slate-700/30 animate-pulse rounded-lg transition-all";

const ChatShimmer = () => {
	return (
		<>
			{Array(10)
				.fill("")
				.map((_, idx) => (
					<div
						key={idx}
						className="w-full h-16 rounded-lg flex items-center p-2 gap-3 hover:bg-black/40 transition-colors cursor-pointer"
					>
						<div className={`h-12 w-12 rounded-full ${shimmerBase}`} />
						<div className="flex flex-col gap-2 w-full">
							<div className={`h-3 w-3/4 ${shimmerBase}`} />
							<div className={`h-3 w-1/2 ${shimmerBase}`} />
						</div>
					</div>
				))}
		</>
	);
};

export const ChatShimmerSmall = () => {
	return (
		<>
			{Array(10)
				.fill("")
				.map((_, idx) => (
					<div
						key={idx}
						className="w-full h-12 rounded-lg flex items-center p-2 gap-3 hover:bg-black/40 transition-colors cursor-pointer"
					>
						<div className={`h-10 w-10 rounded-full ${shimmerBase}`} />
						<div className={`h-3 w-3/4 ${shimmerBase}`} />
						<div className={`h-8 w-8 rounded-md ${shimmerBase}`} />
					</div>
				))}
		</>
	);
};

export default ChatShimmer;

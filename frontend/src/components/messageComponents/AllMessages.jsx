import React, { Fragment, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { VscCheckAll } from "react-icons/vsc";
import { CgChevronDoubleDown } from "react-icons/cg";
import {
	SimpleDateAndTime,
	SimpleDateMonthDay,
	SimpleTime,
} from "../../utils/formateDateTime";

const AllMessages = ({ allMessage }) => {
	const chatBox = useRef();
	const adminId = useSelector((store) => store.auth?._id);
	const isTyping = useSelector((store) => store?.condition?.isTyping);

	const [scrollShow, setScrollShow] = useState(true);

	// Scroll to bottom of chat
	const handleScrollDownChat = () => {
		if (chatBox.current) {
			chatBox.current.scrollTo({
				top: chatBox.current.scrollHeight,
			});
		}
	};

	// Auto scroll and show scroll-to-bottom button logic
	useEffect(() => {
		handleScrollDownChat();
		if (
			chatBox.current.scrollHeight === chatBox.current.clientHeight
		) {
			setScrollShow(false);
		}

		const handleScroll = () => {
			const current = chatBox.current;
			const scrolledToBottom =
				current.scrollTop + current.clientHeight >=
				current.scrollHeight - 30;
			setScrollShow(!scrolledToBottom);
		};

		const chatRef = chatBox.current;
		chatRef.addEventListener("scroll", handleScroll);
		return () => chatRef.removeEventListener("scroll", handleScroll);
	}, [allMessage, isTyping]);

	return (
		<>
			{scrollShow && (
				<div
					className="absolute bottom-16 right-4 z-20 cursor-pointer text-white/50 bg-black/80 hover:bg-black hover:text-white p-1.5 rounded-full"
					onClick={handleScrollDownChat}
				>
					<CgChevronDoubleDown title="Scroll Down" fontSize={24} />
				</div>
			)}

			<div
				className="flex flex-col w-full px-3 gap-1 py-2 overflow-y-auto overflow-hidden scroll-style h-[66vh]"
				ref={chatBox}
			>
				{allMessage?.map((message, idx) => {
					const isMyMessage = message?.sender?._id === adminId;
					const isGroup = message?.chat?.isGroupChat;
					const prevDate = new Date(allMessage[idx - 1]?.updatedAt).toDateString();
					const currDate = new Date(message?.updatedAt).toDateString();
					const showDateHeader = prevDate !== currDate;

					const showAvatar =
						isGroup &&
						!isMyMessage &&
						allMessage[idx + 1]?.sender?._id !== message?.sender?._id;

					return (
						<Fragment key={message._id}>
							{showDateHeader && (
								<div className="sticky top-0 z-10 flex justify-center">
									<span className="text-xs font-light mb-2 mt-1 text-white/50 bg-black h-7 w-fit px-5 rounded-md flex items-center justify-center">
										{SimpleDateMonthDay(message?.updatedAt)}
									</span>
								</div>
							)}

							<div
								className={`flex items-start gap-1 ${
									isMyMessage
										? "flex-row-reverse text-white"
										: "flex-row text-black"
								}`}
							>
								{showAvatar ? (
									<img
										src={message?.sender?.image}
										alt="avatar"
										className="h-9 w-9 rounded-full"
									/>
								) : isGroup && !isMyMessage ? (
									<div className="h-9 w-9" />
								) : null}

								<div
									className={`${
										isMyMessage
											? "bg-gradient-to-tr to-slate-800 from-green-400 rounded-s-lg rounded-ee-2xl"
											: "bg-gradient-to-tr to-slate-800 from-white rounded-e-lg rounded-es-2xl"
									} py-1.5 px-2 min-w-10 text-start flex flex-col relative max-w-[85%]`}
								>
									{isGroup && !isMyMessage && (
										<span className="text-xs font-bold text-start text-green-900">
											{message?.sender?.firstName}
										</span>
									)}

									<div
										className={`mt-1 pb-1.5 ${
											isMyMessage ? "pr-16" : "pr-12"
										}`}
									>
										<span>{message?.message}</span>
										<span
											className="text-[11px] font-light absolute bottom-1 right-2 flex items-end gap-1.5"
											title={SimpleDateAndTime(message?.updatedAt)}
										>
											{SimpleTime(message?.updatedAt)}
											{isMyMessage && (
												<VscCheckAll
													color="white"
													fontSize={14}
												/>
											)}
										</span>
									</div>
								</div>
							</div>
						</Fragment>
					);
				})}

				{isTyping && (
					<div id="typing-animation">
						<span></span>
						<span></span>
						<span></span>
					</div>
				)}
			</div>
		</>
	);
};

export default AllMessages;

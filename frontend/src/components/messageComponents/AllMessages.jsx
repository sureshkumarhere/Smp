import React, { Fragment, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { VscCheckAll } from "react-icons/vsc";
import { CgChevronDoubleDown } from "react-icons/cg";
import {
	SimpleDateMonthDay,
	SimpleTime,
} from "../../utils/formateDateTime";

const AllMessages = ({ allMessage }) => {
	const chatBox = useRef();
	const adminId = useSelector((store) => store.auth?._id);
	const isTyping = useSelector((store) => store?.condition?.isTyping);

	const [scrollShow, setScrollShow] = useState(true);

	const handleScrollDownChat = () => {
		if (chatBox.current) {
			chatBox.current.scrollTo({
				top: chatBox.current.scrollHeight,
			});
		}
	};

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
				className="flex flex-col w-full px-3 py-1 space-y-1 overflow-y-auto scroll-style h-[60vh]"
				ref={chatBox}
			>
				{allMessage?.map((message, idx) => {
					const isMyMessage = message?.sender?._id === adminId;
					const isGroup = message?.chat?.isGroupChat;
					const prevDate = new Date(allMessage[idx - 1]?.updatedAt).toDateString();
					const currDate = new Date(message?.updatedAt).toDateString();
					const showDateHeader = prevDate !== currDate;

					return (
						<Fragment key={message._id}>
							{showDateHeader && (
								<div className="sticky top-0 z-10 flex justify-center">
									<span className="text-xs font-light mb-2 mt-1 text-white/50 bg-black h-7 w-fit px-5 rounded-md flex items-center justify-center">
										{SimpleDateMonthDay(message?.updatedAt)}
									</span>
								</div>
							)}

							<div className={`flex items-start ${isMyMessage ? 'justify-end' : 'justify-start'} gap-2`}>
								{isGroup && !isMyMessage && (
									<img src={message.sender.image} alt="avatar" className="h-8 w-8 rounded-full" />
								)}

								<div className={`relative max-w-[75%] p-2 pb-6 min-w-[6rem] flex flex-col ${isMyMessage
										? 'bg-yellow-200 text-black rounded-tl-lg rounded-bl-lg rounded-br-lg'
										: 'bg-richblack-700 text-white rounded-tr-lg rounded-br-lg rounded-bl-lg'
									}`}>
									{isGroup && !isMyMessage && (
										<span className="text-xs font-semibold text-yellow-400 mb-1">
											{message.sender.firstName}
										</span>
									)}

									{message.message && message.message !== "imagefiles" && message.message !== "videofiles" && (
										<span className={`${isMyMessage ? 'text-base' : 'text-sm'} leading-relaxed`}>
											{message.message}
										</span>
									)}

									{/* Images */}
									{message.image_urls?.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-1">
											{message.image_urls.map((url, idx) => (
												<img
													key={idx}
													src={url}
													alt={`uploaded-img-${idx}`}
													className="max-w-[200px] max-h-[200px] rounded-md object-cover"
												/>
											))}
										</div>
									)}

									{/* Videos */}
									{message.video_urls?.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-1">
											{message.video_urls.map((url, idx) => (
												<video
													key={idx}
													src={url}
													controls
													className="max-w-[200px] max-h-[200px] rounded-md object-cover"
												/>
											))}
										</div>
									)}

									{/* Generic files */}
									{message.files?.length > 0 && (
										<div className="flex flex-col gap-2 mt-1">
											{message.files.map((file, idx) => {
												const fileName = file.name || "download";
												let downloadUrl = file.url;

												// For Cloudinary raw files, use fl_attachment only
												if (
													downloadUrl.includes("cloudinary.com") &&
													downloadUrl.includes("/raw/upload/")
												) {
													downloadUrl = downloadUrl.replace(
														"/upload/",
														"/upload/fl_attachment/"
													);
												}

												return (
													<div key={idx} className="flex items-center gap-2">
														<span className="text-white break-all">{fileName}</span>
														<a
															href={downloadUrl}
															download={fileName}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-400 underline"
															style={{ wordBreak: "break-word" }}
														>
															Download
														</a>
													</div>
												);
											})}
										</div>
									)}

									<span className="absolute bottom-1 right-2 flex items-center text-[10px] text-richblack-400 gap-1">
										{SimpleTime(message.updatedAt)}
										{isMyMessage && <VscCheckAll fontSize={16} />}
									</span>
								</div>

								{isGroup && isMyMessage && (
									<img src={message.sender.image} alt="avatar" className="h-8 w-8 rounded-full" />
								)}
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

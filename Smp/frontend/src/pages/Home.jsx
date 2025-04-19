import React, { useEffect } from "react";
import { MdChat } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import UserSearch from "../components/chatComponents/UserSearch";
import MyChat from "../components/chatComponents/MyChat";
import MessageBox from "../components/messageComponents/MessageBox";
import ChatNotSelected from "../components/chatComponents/ChatNotSelected";
import {
  setChatDetailsBox,
  setSocketConnected,
  setUserSearchBox,
} from "../redux/slices/conditionSlice";
import socket from "../socket/socket";
import { addAllMessages, addNewMessage } from "../redux/slices/messageSlice";
import {
  addNewChat,
  addNewMessageRecieved,
  deleteSelectedChat,
} from "../redux/slices/myChatSlice";
import { toast } from "react-toastify";
import { receivedSound } from "../utils/notificationSound";

let selectedChatCompare;

const Home = () => {
  const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
  const dispatch = useDispatch();
  const isUserSearchBox = useSelector(
    (store) => store?.condition?.isUserSearchBox
  );
  const authUserId = useSelector((store) => store?.auth?._id);

  // SOCKET CONNECTION
  useEffect(() => {
    if (!authUserId) return;
    socket.emit("setup", authUserId);
    socket.on("connected", () => dispatch(setSocketConnected(true)));
  }, [authUserId]);

  // SOCKET MESSAGE RECEIVED
  useEffect(() => {
    selectedChatCompare = selectedChat;
    const messageHandler = (newMessageReceived) => {
      if (
        selectedChatCompare &&
        selectedChatCompare._id === newMessageReceived.chat._id
      ) {
        dispatch(addNewMessage(newMessageReceived));
      } else {
        receivedSound();
        dispatch(addNewMessageRecieved(newMessageReceived));
      }
    };
    socket.on("message received", messageHandler);
    return () => socket.off("message received", messageHandler);
  });

  // SOCKET CLEAR CHAT
  useEffect(() => {
    const clearChatHandler = (chatId) => {
      if (chatId === selectedChat?._id) {
        dispatch(addAllMessages([]));
        toast.success("Cleared all messages");
      }
    };
    socket.on("clear chat", clearChatHandler);
    return () => socket.off("clear chat", clearChatHandler);
  });

  // SOCKET DELETE CHAT
  useEffect(() => {
    const deleteChatHandler = (chatId) => {
      dispatch(setChatDetailsBox(false));
      if (selectedChat && chatId === selectedChat._id) {
        dispatch(addAllMessages([]));
      }
      dispatch(deleteSelectedChat(chatId));
      toast.success("Chat deleted successfully");
    };
    socket.on("delete chat", deleteChatHandler);
    return () => socket.off("delete chat", deleteChatHandler);
  });

  // SOCKET CHAT CREATED
  useEffect(() => {
    const chatCreatedHandler = (chat) => {
      dispatch(addNewChat(chat));
      toast.success("Created & Selected chat");
    };
    socket.on("chat created", chatCreatedHandler);
    return () => socket.off("chat created", chatCreatedHandler);
  });

  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-richblack-900 px-2 md:px-6 py-4">
      <div className="flex w-full h-full border border-richblack-700 rounded-lg overflow-hidden shadow-lg">
        {/* Sidebar - Chat list or User search */}
        <div
          className={`${
            selectedChat ? "hidden" : "block"
          } sm:block sm:w-[35%] w-full h-full bg-richblack-800 relative border-r border-yellow-600`}
        >
          {/* Content */}
          <div className="h-full overflow-y-auto custom-scrollbar">
            {isUserSearchBox ? <UserSearch /> : <MyChat />}
          </div>
        </div>

        {/* Main Chat Area */}
        <div
          className={`${
            !selectedChat ? "hidden" : "block"
          } sm:block sm:w-[65%] w-full h-full bg-richblack-900 relative`}
        >
          {selectedChat ? (
            <MessageBox chatId={selectedChat._id} />
          ) : (
            <ChatNotSelected />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

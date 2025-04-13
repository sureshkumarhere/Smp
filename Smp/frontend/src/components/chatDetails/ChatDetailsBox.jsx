import React, { useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import Overview from "./Overview";
import Member from "./Member";
import ChatSetting from "./ChatSetting";

const ChatDetailsBox = () => {
  const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
  const [detailView, setDetailView] = useState("overview");

  // Debug: check selected chat details
  console.log("selectedChat", selectedChat);

  const menuItems = [
    {
      label: "Overview",
      icon: <CiCircleInfo fontSize={18} />,
      value: "overview",
    },
    {
      label: "Members",
      icon: <HiOutlineUsers fontSize={18} />,
      value: "members",
      // Temporarily always show for debug — remove or re-enable condition later
      // show: selectedChat?.isGroupChat,
    },
    {
      label: "Setting",
      icon: <IoSettingsOutline fontSize={18} />,
      value: "setting",
    },
  ];

  return (
    <div className="flex w-full h-[60vh]">
      {/* Sidebar Tabs */}
      <div className="w-fit p-2 flex flex-col gap-2 bg-richblack-800 rounded-l-lg border-r border-richblack-600">
        {menuItems
          // Temporarily show all items to debug — remove the filter if you want full control
          .filter((item) => item.show !== false)
          .map(({ label, icon, value }) => (
            <div
              key={value}
              onClick={() => setDetailView(value)}
              title={label}
              className={`flex gap-2 items-center px-3 py-2 rounded-md cursor-pointer transition-all duration-200 text-sm font-medium
                ${
                  detailView === value
                    ? "bg-yellow-100 text-richblack-900"
                    : "text-yellow-50 hover:bg-richblack-600"
                }`}
            >
              {icon}
              <span className="hidden sm:block">{label}</span>
            </div>
          ))}
      </div>

      {/* View Container */}
      <div className="flex-1 bg-richblack-900 p-4 rounded-r-lg overflow-y-auto">
        {detailView === "overview" && <Overview />}
        {detailView === "members" && <Member />}
        {detailView === "setting" && <ChatSetting />}
      </div>
    </div>
  );
};

export default ChatDetailsBox;

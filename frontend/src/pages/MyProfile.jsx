import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "../redux/slices/conditionSlice";
import { toast } from "react-toastify";
import { MdOutlineClose } from "react-icons/md";
import { PiUserCircleLight, PiEye, PiEyeClosedLight } from "react-icons/pi";
import { FaUser, FaEnvelope, FaIdBadge, FaUserShield, FaLock } from "react-icons/fa";

const MyProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.auth);
  const [showReset, setShowReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleResetPassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    dispatch(setLoading(true));
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.message === "success") {
          toast.success("Password changed successfully");
          setShowReset(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          toast.error(json.message);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => dispatch(setLoading(false)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black via-blue-900 to-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-tr from-richblack-800 to-richblack-700 border border-richblack-600 rounded-2xl p-10 shadow-2xl">
        <Link
          to="/"
          className="text-yellow-300 hover:text-yellow-200 underline mb-6 inline-block"
        >
          &larr; Back
        </Link>

        <h2 className="flex items-center justify-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200 mb-8 gap-2">
          <PiUserCircleLight size={32} /> My Profile
        </h2>

        {(() => {
          const seed = `${user.firstName} ${user.lastName}`;
          const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
          return (
            <div className="flex justify-center mb-8">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400"
              />
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-richblack-700 rounded-lg">
          <div className="flex items-start gap-3">
            <FaUser className="mt-1 text-yellow-400" />
            <div>
              <p className="text-sm text-richblack-200">Full Name</p>
              <p className="font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaEnvelope className="mt-1 text-yellow-400" />
            <div>
              <p className="text-sm text-richblack-200">Email Address</p>
              <p className="font-medium text-white">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaIdBadge className="mt-1 text-yellow-400" />
            <div>
              <p className="text-sm text-richblack-200">Registration No.</p>
              <p className="font-medium text-white">{user.regNo}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaUserShield className="mt-1 text-yellow-400" />
            <div>
              <p className="text-sm text-richblack-200">Account Type</p>
              <p className="font-medium text-white">
                {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            className="w-full sm:w-auto py-3 px-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-semibold shadow-lg hover:from-yellow-500 hover:to-yellow-400 transition"
          >
            Update Profile
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="w-full sm:w-auto py-3 px-8 rounded-full border border-yellow-300 text-yellow-300 font-semibold hover:bg-yellow-300 hover:text-black transition"
          >
            Reset Password
          </button>
        </div>

        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-richblack-800 border border-richblack-600 rounded-2xl p-8 relative shadow-xl">
              <button
                onClick={() => setShowReset(false)}
                className="absolute top-4 right-4 text-richblack-300 hover:text-pink-300 transition"
                title="Close"
              >
                <MdOutlineClose size={24} />
              </button>
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">Reset Password</h2>
              <div className="space-y-4">
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" />
                  <input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-12 w-full pl-10 pr-12 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                    placeholder="Current Password"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-richblack-300 hover:text-white transition"
                    onClick={() => setShowCurrentPwd((v) => !v)}
                    title={showCurrentPwd ? "Hide" : "Show"}
                  >
                    {showCurrentPwd ? <PiEyeClosedLight size={20} /> : <PiEye size={20} />}
                  </span>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" />
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 w-full pl-10 pr-12 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                    placeholder="New Password"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-richblack-300 hover:text-white transition"
                    onClick={() => setShowNewPwd((v) => !v)}
                    title={showNewPwd ? "Hide" : "Show"}
                  >
                    {showNewPwd ? <PiEyeClosedLight size={20} /> : <PiEye size={20} />}
                  </span>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" />
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full pl-10 pr-12 bg-richblack-700 border border-richblack-600 rounded-xl text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                    placeholder="Confirm Password"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-richblack-300 hover:text-white transition"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    title={showConfirmPwd ? "Hide" : "Show"}
                  >
                    {showConfirmPwd ? <PiEyeClosedLight size={20} /> : <PiEye size={20} />}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleResetPassword}
                  className="flex-1 py-2 px-4 rounded-full bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
                >
                  Change Password
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 px-4 rounded-full bg-richblack-600 text-white font-semibold hover:bg-richblack-700 transition"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile; 
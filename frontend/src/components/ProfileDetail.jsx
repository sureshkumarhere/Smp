import React from "react";
import { MdOutlineClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setProfileDetail } from "../redux/slices/conditionSlice";
import { toast } from "react-toastify";

const ProfileDetail = () => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.auth);

  const handleUpdate = () => {
    toast.warn("Coming soon");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-lg border border-richblack-600 bg-richblack-800 text-richblack-5 px-6 py-8 relative shadow-lg">
        {/* Close Button */}
        <button
          onClick={() => dispatch(setProfileDetail())}
          className="absolute top-4 right-4 text-richblack-300 hover:text-pink-300 transition"
          title="Close"
        >
          <MdOutlineClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-center text-yellow-50 mb-6">Your Profile</h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Image */}
          <img
            src={user.image}
            alt="user profile"
            className="w-24 h-24 rounded-full object-cover border border-richblack-600"
          />

          {/* Info */}
          <div className="flex flex-col gap-2 text-sm sm:text-base w-full">
            <p className="text-richblack-100">
              <span className="font-medium text-richblack-200">Name:</span> {user.firstName} {user.lastName}
            </p>
            <p className="text-richblack-100">
              <span className="font-medium text-richblack-200">Email:</span> {user.email}
            </p>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpdate}
                className="bg-yellow-50 hover:bg-yellow-100 text-black font-semibold py-2 px-4 rounded-md transition"
              >
                Update
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.reload();
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;

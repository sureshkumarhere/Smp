import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { checkValidSignInFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";
import { FaEnvelope, FaLock } from "react-icons/fa";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [load, setLoad] = useState("");
  const [isShow, setIsShow] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logInUser = (e) => {
    toast.loading("Wait until you SignIn");
    e.target.disabled = true;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((json) => {
        setLoad("");
        e.target.disabled = false;
        toast.dismiss();

        if (json.token) {
          localStorage.setItem("token", json.token);
          dispatch(addAuth(json.data));
          navigate("/");
          toast.success(json?.message);
        } else {
          toast.error(json?.message);
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoad("");
        toast.dismiss();
        toast.error("Error: " + err.code);
        e.target.disabled = false;
      });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      const error = checkValidSignInFrom(email, password);
      if (error) return toast.error(error);
      setLoad("Loading...");
      logInUser(e);
    } else {
      toast.error("Required: All Fields");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-10 bg-gradient-to-br from-richblack-900 to-richblack-800">
      <div className="w-full max-w-md bg-richblack-800 border border-richblack-600 rounded-lg p-6 shadow-md">
        <h2 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200 mb-8">
          Sign In
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="flex flex-col relative">
            <label
              htmlFor="email"
              className="mb-1 text-sm font-medium text-richblack-200"
            >
              Email Address
            </label>
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" />
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10 px-4 rounded-xl bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col relative">
            <label
              htmlFor="password"
              className="mb-1 text-sm font-medium text-richblack-200"
            >
              Password
            </label>
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-richblack-400" />
            <input
              type={isShow ? "text" : "password"}
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-10 pr-12 px-4 rounded-xl bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
            />
            {password && (
              <span
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-richblack-300 hover:text-white transition"
                onClick={() => setIsShow(!isShow)}
                title={isShow ? "Hide Password" : "Show Password"}
              >
                {isShow ? <PiEyeClosedLight size={20} /> : <PiEye size={20} />}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={load !== ""}
            className="w-full py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-yellow-200 text-richblack-900 hover:from-yellow-300 hover:to-yellow-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {load || "Sign In"}
          </button>

          {/* Links */}
          <div className="flex justify-end text-sm text-richblack-200 mt-4">
            <Link to="/signup" className="hover:text-pink-300 transition">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

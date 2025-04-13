import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkValidSignUpFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [isShow, setIsShow] = useState(false);
  const [load, setLoad] = useState("");
  const navigate = useNavigate();

  const signUpUser = (e) => {
    toast.loading("Wait until you SignUp");
    e.target.disabled = true;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password, regNo }),
    })
      .then((res) => res.json())
      .then((json) => {
        toast.dismiss();
        setLoad("");
        e.target.disabled = false;

        if (json.token) {
          toast.success(json?.message);
          navigate("/signin");
        } else toast.error(json?.message);
      })
      .catch((err) => {
        console.error("Error:", err);
        toast.dismiss();
        setLoad("");
        toast.error("Error: " + err.code);
        e.target.disabled = false;
      });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (firstName && lastName && email && password && regNo) {
      const error = checkValidSignUpFrom(firstName, lastName, email, password, regNo);
      if (error) return toast.error(error);
      setLoad("Loading...");
      signUpUser(e);
    } else {
      toast.error("Required: All Fields");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] bg-richblack-900 text-richblack-5 px-4 py-8">
      <div className="w-full max-w-md bg-richblack-800 border border-richblack-600 rounded-lg p-6 shadow-md">
        <h2 className="text-3xl font-semibold text-center text-richblack-900 mb-6 bg-yellow-50 py-2 rounded-md">
          Sign Up
        </h2>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* First Name */}
          <div className="flex flex-col">
            <label htmlFor="firstName" className="mb-1 text-sm font-medium text-richblack-200">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-4 py-3 rounded-lg bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label htmlFor="lastName" className="mb-1 text-sm font-medium text-richblack-200">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-4 py-3 rounded-lg bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 text-sm font-medium text-richblack-200">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          {/* Registration Number */}
          <div className="flex flex-col">
            <label htmlFor="regNo" className="mb-1 text-sm font-medium text-richblack-200">
              Registration Number
            </label>
            <input
              type="text"
              id="regNo"
              placeholder="22IT123"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              className="px-4 py-3 rounded-lg bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col relative">
            <label htmlFor="password" className="mb-1 text-sm font-medium text-richblack-200">
              Password
            </label>
            <input
              type={isShow ? "text" : "password"}
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-lg bg-richblack-700 border border-richblack-600 text-white placeholder:text-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
            {password && (
              <span
                className="absolute right-4 top-10 cursor-pointer text-richblack-300 hover:text-white transition"
                onClick={() => setIsShow(!isShow)}
              >
                {isShow ? <PiEyeClosedLight size={20} /> : <PiEye size={20} />}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={load !== ""}
            className="w-full py-3 text-lg font-semibold rounded-lg bg-yellow-300 text-black hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {load || "Sign Up"}
          </button>

          {/* Link to Sign In */}
          <div className="text-center mt-4 text-sm text-richblack-200">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-pink-400 hover:underline hover:text-pink-300 transition"
            >
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;

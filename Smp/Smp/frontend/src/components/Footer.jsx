import React from "react";
import { FaPenAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-richblack-800 text-richblack-100 px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        {/* Brand Section */}
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
          SMP HUB
          </h1>
          <p className="text-sm text-richblack-300">
            Collabroation and Interaction for Students at MNNIT
          </p>
        </div>

        

        {/* Pages Section */}
        <div className="flex flex-col gap-1 min-w-[200px]">
          <h2 className="text-lg font-semibold mb-1 text-richblack-50">
            Pages
          </h2>
          <Link
            to="/"
            className="hover:text-yellow-400 hover:underline transition"
          >
            Chat App
          </Link>
          <Link
            to="/signin"
            className="hover:text-yellow-400 hover:underline transition"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="hover:text-yellow-400 hover:underline transition"
          >
            Sign Up
          </Link>
          <Link
            to="/home"
            className="hover:text-yellow-400 hover:underline transition"
          >
            Home
          </Link>
        </div>

        
      </div>

      <div className="mt-10 text-center text-sm text-richblack-400">
        &copy; {new Date().getFullYear()} SMP HUB All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

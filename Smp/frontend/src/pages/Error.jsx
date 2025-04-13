import React from "react";
import { Link } from "react-router-dom";

const Error = () => {
  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center bg-richblack-900 text-white px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-yellow-50">
        Oops! Something went wrong.
      </h1>
      <p className="text-lg sm:text-xl mb-6 text-richblack-200">
        404 | Bad Request
      </p>

      <Link
        to="/"
        className="bg-yellow-300 text-black px-6 py-3 rounded-md text-sm sm:text-base font-semibold hover:bg-yellow-400 transition"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default Error;

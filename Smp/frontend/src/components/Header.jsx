// Header.jsx
import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo2.jpeg";
import { useDispatch, useSelector } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import handleScrollTop from "../utils/handleScrollTop";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdNotificationsActive,
} from "react-icons/md";
import {
  setHeaderMenu,
  setLoading,
  setNotificationBox,
  setProfileDetail,
} from "../redux/slices/conditionSlice";
import { IoLogOutOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";

const Header = () => {
  const user = useSelector((store) => store.auth);
  const isHeaderMenu = useSelector((store) => store?.condition?.isHeaderMenu);
  const newMessageRecieved = useSelector(
    (store) => store?.myChat?.newMessageRecieved
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const getAuthUser = (token) => {
    dispatch(setLoading(true));
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        dispatch(addAuth(json.data));
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err);
        dispatch(setLoading(false));
      });
  };

  useEffect(() => {
    if (token) {
      getAuthUser(token);
      navigate("/");
    } else {
      navigate("/signin");
    }
    dispatch(setHeaderMenu(false));
  }, [token]);

  const { pathname } = useLocation();
  useEffect(() => {
    if (user) {
      navigate("/");
    } else if (pathname !== "/signin" && pathname !== "/signup") {
      navigate("/signin");
    }
    handleScrollTop();
  }, [pathname, user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
    navigate("/signin");
  };

  useEffect(() => {
    let prevScrollPos = window.pageYOffset;
    const handleScroll = () => {
      let currentScrollPos = window.pageYOffset;
      if (prevScrollPos < currentScrollPos && currentScrollPos > 80) {
        document.getElementById("header").classList.add("hiddenbox");
      } else {
        document.getElementById("header").classList.remove("hiddenbox");
      }
      prevScrollPos = currentScrollPos;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerMenuBox = useRef(null);
  const headerUserBox = useRef(null);

  const handleClickOutside = (event) => {
    if (
      headerMenuBox.current &&
      !headerUserBox?.current?.contains(event.target) &&
      !headerMenuBox.current.contains(event.target)
    ) {
      dispatch(setHeaderMenu(false));
    }
  };

  useEffect(() => {
    if (isHeaderMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHeaderMenu]);

  return (
    <div
      id="header"
      className="w-full h-16 fixed top-0 z-50 md:h-20 shadow-md flex justify-between items-center px-6 font-semibold bg-richblack-900 text-white transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <Link to={"/"}>
          <img src={Logo} alt="ChatApp" className="h-12 w-12 rounded-full" />
        </Link>
        <Link to={"/"}>
          <span className="text-xl font-bold text-white hover:text-yellow-400">
            SMP HUB
          </span>
        </Link>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          <span
            title={`You have ${newMessageRecieved.length} new notifications`}
            className={`relative cursor-pointer ${
              newMessageRecieved.length > 0 ? "animate-bounce" : ""
            }`}
            onClick={() => dispatch(setNotificationBox(true))}
          >
            <MdNotificationsActive fontSize={25} />
            <span className="absolute -top-1 -right-2 text-xs bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center">
              {newMessageRecieved.length}
            </span>
          </span>

          <span className="hidden md:block">Hi, {user.firstName}</span>

          <div
            ref={headerUserBox}
            onClick={() => dispatch(setHeaderMenu(!isHeaderMenu))}
            className="flex items-center gap-1 border border-richblack-700 rounded-full bg-richblack-800 px-2 py-1 cursor-pointer hover:scale-105 transition-transform"
          >
            <img
              src={user.image}
              alt="user"
              className="w-10 h-10 rounded-full"
            />
            {isHeaderMenu ? (
              <MdKeyboardArrowDown fontSize={20} />
            ) : (
              <MdKeyboardArrowUp fontSize={20} />
            )}
          </div>

          {isHeaderMenu && (
            <div
              ref={headerMenuBox}
              className="absolute top-16 right-4 w-44 bg-richblack-800 border border-richblack-600 text-white rounded-lg shadow-lg z-50"
            >
              <div
                onClick={() => {
                  dispatch(setHeaderMenu(false));
                  dispatch(setProfileDetail());
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-richblack-600 cursor-pointer"
              >
                <PiUserCircleLight fontSize={20} />
                <span>Profile</span>
              </div>
              <div
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 hover:bg-richblack-600 cursor-pointer"
              >
                <IoLogOutOutline fontSize={20} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link to={"/signin"}>
          <button className="py-2 px-5 rounded-full bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-all">
            Sign In
          </button>
        </Link>
      )}
    </div>
  );
};

export default Header;

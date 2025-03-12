import React from 'react'
import logo from "../assets/Preview21.png"
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
const Navbar = (props) => {
  let isLoggedIn=props.isLoggedIn;
  let setisLoggedIn=props.setisLoggedIn;

  return (
    <div className='flex justify-between items-center w-11/12 max-w-[1160px] py-4 mx-auto'> 
        <Link to="/" >
            <img src={logo} alt="logo" width={160} height={32} loading="lazy" className="opacity-80"/>
        </Link>

        <nav>
          <ul className="text-white flex gap-x-6">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/">About</Link></li>
            <li><Link to="/">Contact</Link></li>
          </ul>
        </nav>

        <div className="flex items-center gap-3x-4">
          { !isLoggedIn &&
            <Link to="/login">
              <button className="bg-[#0F172A] text-white py-[8px] px-[12px] rounded-[8px] border border-[#27272a]">
              Login</button>
            </Link>
          }
          { !isLoggedIn &&
            <Link to="/signup">
              <button className="bg-[#0F172A] text-white py-[8px] px-[12px] rounded-[8px] border border-[#27272a]">
              Sign Up</button>
            </Link>
          }
          { isLoggedIn &&
            <Link to="/">
              <button onClick={()=>{
                setisLoggedIn(false);
                toast.success("Logged Out");
              }}
              className="bg-[#0F172A] text-white py-[8px] px-[12px] rounded-[8px] border border-[#27272a]">
              Log Out</button>
            </Link>
          }
          { isLoggedIn &&
            <Link to="/dashboard">
              <button className="bg-[#0F172A] text-white py-[8px] px-[12px] rounded-[8px] border border-[#27272a]">
              Dashboard</button>
            </Link>
          }
        </div>
    </div>
  )
}

export default Navbar
import React from 'react'
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"
import {FcGoogle} from 'react-icons/fc'

const Template = ({title,desc1,desc2,image,formtype,setisLoggedIn}) => {
  return (
    <div className="flex w-11/12 max-w-[1160px] py-12 mx-auto gap-x-20 justify-between gap-y-0">
        <div className="w-11/12 max-w-[450px]">
            <h2 className="text-white font-semibold text-[1.875rem] leading-[2.375rem]">{title}</h2>
            <p className="text-[1.125rem] leading-[1.625rem]">
                <span className="text-white">{desc1}</span>
                <br/>
                <span className="text-blue italic">{desc2}</span>
            </p>

            {formtype === "signup" ? (<SignupForm setisLoggedIn={setisLoggedIn}/>) : (<LoginForm setisLoggedIn={setisLoggedIn} />)}
            
            <div className="flex w-full items-center my-4 gap-x-2">
                <div className="w-full h-[1px] bg-white"></div>
                <p className="bg-[#27272a] font-medium leading-[1.375rem]">OR</p>
                <div className="w-full h-[1px] bg-white"></div>
            </div>

            <button className="w-full flex justify-center rounded-[8px] font-medium text-white border border-[#27272a] px-[12px] py-[8px] gap-x-2 mt-4"> 
                <FcGoogle/>
                <p>Sign Up with Google</p>
            </button>
        </div>

        <div className='relative w-11/12 max-w-[450px]'>
            <img src={image}
                alt="Building"
                width={558}
                height={490}
                loading="lazy"
                className="absolute -top-4 right-4"

                />
        </div>
    </div>
  )
}

export default Template
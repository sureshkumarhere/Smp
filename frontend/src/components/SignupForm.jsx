import React from 'react'
import {AiOutlineEye,AiOutlineEyeInvisible} from "react-icons/ai"
import {useState} from 'react'
import {toast,ToastContainer} from 'react-toastify'
import {useNavigate} from 'react-router-dom'

const SignupForm = ({setisLoggedIn}) => {
    const navigate=useNavigate();
    const [formData, setformData] = useState({
        firstName:"",lastName:"",email:"",password:"",
        confirmPassword:"",
    })

    const [showPassword, setshowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [accountType, setaccountType] = useState("student")

    function changeHandler(event){
        setformData((prevData) => ({
            ...prevData,
            [event.target.name]: event.target.value
        }));
    }
    function submitHandler(event){
        event.preventDefault();
        if(formData.password!=formData.confirmPassword){
            toast.error("Password don't match");
            return
        }
        setisLoggedIn(true);
        toast.success("Account Created");

        const finalData={
            ...formData,
            accountType
        }

        console.log(finalData);
        navigate("/dashboard");
    }
    
  return (
    <div>
        <div className="flex bg-[#1c1c1f] p-1 gap-x-1 my-6 rounded-md max-w-max">
            <button 
            className={`${accountType==="Student"?
                "bg-black text-white":"bg-transparent text-[#B4B6B]"
            } py-2 px-5 rounded-md  transition-all duration-200`}
            onClick={()=> setaccountType("Student")}>
                Student
            </button>
            <button
            className={`${accountType==="Mentor"?
                "bg-black text-white":"bg-transparent text-[#B4B6B]"
            } py-2 px-5 rounded-md  transition-all duration-200`}
            onClick={()=> setaccountType("Mentor")}>
                Mentor
            </button>
        </div>

        <form onSubmit={submitHandler}>
            <div className="flex justify-between">
                <label>
                <p className="text-[0.875rem] text-[#f0f0f1] nb-1 leading-[1.375rem]">First Name <sup className="text-red">*</sup></p>
                    <input
                        required
                        type="text"
                        name="firstName"
                        onChange={changeHandler}
                        placeholder="Enter First Name"
                        value={formData.firstName}  
                        className="bg-[#1c1c1f] rounded-[0.5rem] text-white w-full p-[12px]"

                    />

                </label>

                <label>
                <p className="text-[0.875rem] text-[#f0f0f1] nb-1 leading-[1.375rem]">Last Name <sup className="text-red">*</sup></p>
                    <input
                        required
                        type="text"
                        name="lastName"
                        onChange={changeHandler}
                        placeholder="Enter Last Name"
                        value={formData.lastName}
                        className="bg-[#1c1c1f] rounded-[0.5rem] text-white w-full p-[12px] mb-4"
                        />

                </label>
            </div>

            <label className="w-full">
            <p className="text-[0.875rem] text-[#f0f0f1] nb-1 leading-[1.375rem]">Email<sup className="text-red">*</sup></p>
                <input
                    required
                    type="email"
                    name="email"
                    onChange={changeHandler}
                    placeholder="Enter Email Address"
                    value={formData.email}
                    className="bg-[#1c1c1f] rounded-[0.5rem] text-white w-full p-[12px] mb-4"
                    />

            </label>

            <div className="w-full flex gap-x-4">
                <label className="w-full relative">
                <p className="text-[0.875rem] text-[#f0f0f1] nb-1 leading-[1.375rem]">Create Password<sup className="text-red">*</sup></p>
                    <input
                        required
                        type={showPassword? ("text"):("password")}
                        name="password"
                        onChange={changeHandler}
                        placeholder="Enter Password"
                        value={formData.password} 
                        className="bg-[#1c1c1f] rounded-[0.5rem] text-white w-full p-[12px]"
                   
                    />
                    <span className="absolute right-3 top-[38px] cursor-pointer" 
                         onClick={()=> setshowPassword((prev)=>!prev)}>
                        {showPassword?(<AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF"/>):(<AiOutlineEye fontSize={24} fill="#AFB2BF"/>)}
                    </span>
                </label>

                <label className="w-full relative">
                <p className="text-[0.875rem] text-[#f0f0f1] nb-1 leading-[1.375rem]">Confirm Password<sup className="text-red">*</sup></p>
                    <input
                        required
                        type={showConfirmPassword? ("text"):("password")}
                        name="confirmPassword"
                        onChange={changeHandler}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword} 
                        className="bg-[#1c1c1f] rounded-[0.5rem] text-white w-full p-[12px]"                   
                    />
                    <span className="absolute right-3 top-[38px] cursor-pointer" 
                         onClick={()=> setShowConfirmPassword((prev)=>!prev)}>
                        {showConfirmPassword?(<AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF"/>):(<AiOutlineEye fontSize={24} fill="#AFB2BF"/>)}
                    </span>
                </label>
            </div>

            <button className="w-full mt-4 bg-[#fefce8] rounded-[8px] font-medium text-black px-[12px] py-[8px]">
                Create Account
            </button>
        </form>
    </div>
  )
}

export default SignupForm
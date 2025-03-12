import React from 'react'
import signupImg from "../assets/signup.jpg"
import Template from "../components/Template"

const Signup = ({ setisLoggedIn }) => {  
  return (
    <div className="min-h-screen">
      <Template
        title="Join Now"
        desc1="Grow under the Mentorship of your Seniors"
        desc2="Sign up to be a part of the SMP community"
        image={signupImg}
        formtype="signup"
        setisLoggedIn={setisLoggedIn}  
      />
    </div>
  )
}

export default Signup;

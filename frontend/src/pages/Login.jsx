import React from 'react'
import loginImg from "../assets/login.jpg"
import Template from "../components/Template"
const Login = ({setisLoggedIn}) => {
  return (
    <div>
      <Template
        title="Welcome Back"
        desc1="to your"
        desc2="SMP HUB"
        image={loginImg}
        formtype="login"
        setisLoggedIn={setisLoggedIn}
      />
    </div>
  )
}

export default Login 
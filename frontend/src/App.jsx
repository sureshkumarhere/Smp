import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { useState } from 'react';
import PrivateRoute from "./components/PrivateRoute"
import ResourceHub from './pages/ResourceHub';

function App() {
  const [isLoggedIn, setisLoggedIn] = useState(false);
  return (
    <div className="w-full h-screen bg-[#1E2640] flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} setisLoggedIn={setisLoggedIn} />

      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
        <Route path="login" element={<Login setisLoggedIn={setisLoggedIn} />} />
        <Route path="signup" element={<Signup setisLoggedIn={setisLoggedIn} />} /> 
        <Route path="/resourcehub" element={<ResourceHub />}/>
        <Route path="dashboard" element={
          <PrivateRoute isLoggedIn={isLoggedIn}>
            <Dashboard/>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}

export default App;


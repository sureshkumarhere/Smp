import { useState } from 'react'
import react from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import './App.css'
import ResourceHub from './pages/ResourceHub';

function App() {
  

  return (
    <>
        
    


    <Router>
        <Routes>
          <Route path="/resourcehub" element={<ResourceHub />}></Route>
        </Routes>
    
    </Router>
    </>
  )
}

export default App

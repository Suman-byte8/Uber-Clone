import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import 'remixicon/fonts/remixicon.css';
import Signup from './pages/authentication/Signup';
import EnterOTP from './pages/authentication/EnterOTP';
import UserHome from './pages/user/UserHome';
import TripPlan from './pages/user/TripPlan';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path='/enter-otp' element={<EnterOTP />} />
      <Route path="/user-home" element={<UserHome/>}/>
      <Route path="/plan-trip" element={<TripPlan/>}/>
      
    </Routes>
  )
}

export default App

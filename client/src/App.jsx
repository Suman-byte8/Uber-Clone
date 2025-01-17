import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "remixicon/fonts/remixicon.css";
import Signup from "./pages/otp authentication/Signup";
import EnterOTP from "./pages/otp authentication/EnterOTP";
import UserHome from "./pages/user/UserHome";
import TripPlan from "./pages/user/TripPlan";
import AuthPage from "./pages/authentication/AuthPage";
import UserSignUp from "./pages/user/UserSignUp";
import CaptainSignUp from "./pages/captain/CaptainSignUp";
import CaptainHome from "./pages/captain/CaptainHome";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/enter-otp" element={<EnterOTP />} />
      <Route path="/user-home" element={<UserHome />} />
      <Route path="/plan-trip" element={<TripPlan />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/user-signup" element={<UserSignUp />} />
      <Route path="/captain-signup" element={<CaptainSignUp />} />
      <Route path="/captain-home" element={<CaptainHome />} />
    </Routes>
  );
};

export default App;

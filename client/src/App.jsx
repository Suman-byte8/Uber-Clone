import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { UserProvider, useUserContext } from "./components/UserContext.jsx"; // Import UserProvider and useUserContext
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
import CaptainLogin from "./pages/captain/CaptainLogin";
import UserAccount from "./pages/user/UserAccount.jsx";
import UserLogin from "./pages/user/UserLogin";
import ChooseRidePanel from "./components/ChooseRidePanel.jsx";

const App = () => {
  return (
    <UserProvider>
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
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/captain-login" element={<CaptainLogin />} />
        <Route path="/user-account" element={<UserAccount />} />
        <Route path="/test" element={<ChooseRidePanel/>}/>
      </Routes>
    </UserProvider>
  );
};

export default App;

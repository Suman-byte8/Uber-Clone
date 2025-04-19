import React from "react";
import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./components/UserContext.jsx";
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
import CaptainProfile from "./pages/captain/CaptainProfile";
import UserAccount from "./pages/user/UserAccount";
import UserLogin from "./pages/user/UserLogin";
import ChooseRidePanel from "./components/ChooseRidePanel";
import ProtectedRoute from "./components/ProtectedRoute";
import CaptainProtectedWrapper from './components/CaptainProtectedWrapper';

const App = () => {
  return (
    <UserProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/enter-otp" element={<EnterOTP />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/user-signup" element={<UserSignUp />} />
        <Route path="/captain-signup" element={<CaptainSignUp />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/captain-login" element={<CaptainLogin />} />

        {/* Protected User Routes */}
        <Route path="/user-home" element={
          <ProtectedRoute requiredRole="user">
            <UserHome />
          </ProtectedRoute>
        } />
        <Route path="/plan-trip" element={
          <ProtectedRoute requiredRole="user">
            <TripPlan />
          </ProtectedRoute>
        } />
        <Route path="/user-account" element={
          <ProtectedRoute requiredRole="user">
            <UserAccount />
          </ProtectedRoute>
        } />

        {/* Protected Captain Routes */}
        <Route path="/captain-home" element={
          <CaptainProtectedWrapper>
            <CaptainHome />
          </CaptainProtectedWrapper>
        } />
        <Route path="/captain-home/profile" element={
          <CaptainProtectedWrapper>
            <CaptainProfile />
          </CaptainProtectedWrapper>
        } />

        {/* Test Route */}
        <Route path="/test" element={<ChooseRidePanel/>}/>
      </Routes>
    </UserProvider>
  );
};

export default App;

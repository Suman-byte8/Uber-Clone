import React from "react";
import { Link } from "react-router-dom";

const AuthPage = () => {
  return (
    <div className="w-screen max-h-screen">
      <nav className="w-full bg-black py-5 px-4">
        <img
          src="https://freelogopng.com/images/all_img/1659768779uber-logo-white.png"
          alt=""
          className="w-24 h-auto"
        />
      </nav>

      <div className="w-full bg-[#f6f6f6] p-3">
        <img
          src="https://www.uber-assets.com/image/upload/q_auto:eco,c_fill,h_436,w_654/v1565733741/assets/0f/9719ad-69a4-4c0d-9444-ce6d8c3f9759/original/Signup.svg"
          alt=""
          className="w-full h-auto"
        />
        <p className="py-2 text-3xl font-semibold my-3">
          Log in to access your account
        </p>
      </div>

      <div className="w-full px-6 py-4 flex flex-col gap-4">
        <Link
          to="/captain-signup"
          className="_driver flex items-center w-full justify-between text-2xl font-bold border-b-2 pb-8 border-black"
        >
          <h4 className="">Driver</h4>
          <i class="ri-arrow-right-long-line"></i>
        </Link>

        <Link
          to="/user-signup"
          className="_rider flex items-center w-full justify-between text-2xl font-bold border-b-2 pb-8 border-black"
        >
          <h4 className="">Rider</h4>
          <i class="ri-arrow-right-long-line"></i>
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;

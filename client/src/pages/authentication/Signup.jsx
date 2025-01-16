import React from "react";
import googleLogo from '../../assets/google_logo.png'
import emailLogo from '../../assets/email_logo.png'
import appleLogo from '../../assets/apple_logo.png'



const Signup = () => {
  return (
    <div className="h-screen w-screen p-4 flex items-center flex-col">
      <h4 className="w-screen px-4 font-base text-2xl">
        Enter your mobile number
      </h4>

      <div className="_mobileNumber my-4 flex w-full border-[3px] border-black rounded-lg p-3">
        <select className="outline-0 border-none w-12">
          <option value="+91">+91</option>
        </select>
        <input
          type="number"
          className="outline-0 border-none w-full ml-2"
          placeholder="Mobile number"
        />
        <i className="ri-user-shared-2-line font-bold text-xl"></i>
      </div>

      <button className="bg-black w-full  p-5 rounded-xl text-white flex items-center justify-center text-xl font-medium">
        Continue
      </button>

      <div className="_or w-full flex my-4">
        <div className="w-full border-t border-gray-400 my-4"></div>
        <span className="text-gray-400 px-2">or</span>
        <div className="w-full border-t border-gray-400 my-4"></div>
      </div>

      <div className="_email w-full flex flex-col gap-3">
        <button className="bg-[#F5F7F8] w-full  p-5 rounded-xl text-black flex items-center justify-center text-xl font-medium">
         <img src={googleLogo} alt="" className="w-8 mx-4 h-auto" />
          Continue with Google
        </button>

        <button className="bg-[#F5F7F8] w-full  p-5 rounded-xl text-black flex items-center justify-center text-xl font-medium">
         <img src={emailLogo} alt="" className="w-8 mx-4 h-auto" />
          Continue with Email
        </button>

        <button className="bg-[#F5F7F8] w-full  p-5 rounded-xl text-black flex items-center justify-center text-xl font-medium">
         <img src={appleLogo} alt="" className="w-8 mx-4 h-auto" />
          Continue with Apple
        </button>
      </div>

      <div className="_or w-full flex my-4">
        <div className="w-full border-t border-gray-400 my-4"></div>
        <span className="text-gray-400 px-2">or</span>
        <div className="w-full border-t border-gray-400 my-4"></div>
      </div>

      <div className="_findAccount text-xl flex gap-3 font-semibold items-center justify-center w-full">
      <i class="ri-search-line text-black"></i>
        <span className="text-black">Find my account</span>
      </div>

      <p className="text-pretty font-light text-sm my-4 py-2">
        By proceeding, you consent to get calls, WhatsApp or SMS/RCS messages, including by automated means, from Uber and its affiliates to the number provided.
      </p>
    </div>
  );
};

export default Signup;

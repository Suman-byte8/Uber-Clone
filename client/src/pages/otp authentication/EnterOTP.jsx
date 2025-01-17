import React, { useState, useEffect, useRef } from 'react';

const EnterOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  const handleInputChange = (e, index) => {
    const value = e.target.value;

    if (value.match(/^\d?$/)) {
      setOtp(otp.map((val, i) => (i === index ? value : val)));

      if (value !== '' && index < otp.length - 1) {
        // Move focus to the next input
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      setOtp(otp.map((val, i) => (i === index ? '' : val)));

      if (index > 0) {
        // Move focus to the previous input
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="w-screen max-h-screen p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        Enter the 4-digit code sent via SMS at 070633 70921.
      </h1>
      <p className="text-xl underline font-thin">Changed your mobile number?</p>
      <div className="_OTPInput flex gap-3 my-4">
        {otp.map((val, index) => (
          <input
            key={index}
            type="text"
            value={val}
            maxLength={1} // Limit input to 1 character
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => (inputRefs.current[index] = el)} // Assign ref to each input
            className={`active:border-2 border-black w-14 h-14 rounded-xl bg-[#e0e0e1] text-4xl text-center font-bold`}
          />
        ))}
      </div>
      <div className="_resendCode my-2 flex flex-col gap-4 w-fit">
        <button className="bg-[#e0e0e1] text-black p-3 rounded-full font-semibold text-lg">
          Resend code via SMS
        </button>
        <button className="bg-[#e0e0e1] text-black p-3 rounded-full font-semibold text-lg">
          Call me with code
        </button>
      </div>
    </div>
  );
};

export default EnterOTP;

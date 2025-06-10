import React from "react";
import { CiCompass1 } from "react-icons/ci";
import { FaHistory } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";

const Footer = ({ activeIcon, setActiveIcon, handleCompassClick }) => {
  return (
    <footer className="fixed bottom-0 w-full flex items-center justify-between p-4 bg-white z-100">
      {/* Compass Button */}
      <button
        onClick={() => {
          handleCompassClick();
          setActiveIcon("compass");
        }}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
          activeIcon === "compass"
            ? "bg-blue-500 text-white text-xl"
            : "bg-white text-gray-500 text-lg"
        }`}
      >
        <CiCompass1 />
      </button>

      {/* Ride History Button */}
      <button
        onClick={() => setActiveIcon("trend")}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
          activeIcon === "trend"
            ? "bg-blue-500 text-white text-xl"
            : "bg-white text-gray-500 text-lg"
        }`}
      >
        <FaHistory />
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setActiveIcon("settings")}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
          activeIcon === "settings"
            ? "bg-blue-500 text-white text-xl"
            : "bg-white text-gray-500 text-lg"
        }`}
      >
        <CiSettings />
      </button>
    </footer>
  );
};

export default Footer;

import React from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-white p-4">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <p className="text-gray-600">Settings page content goes here.</p>
    </div>
  );
};

export default Settings;
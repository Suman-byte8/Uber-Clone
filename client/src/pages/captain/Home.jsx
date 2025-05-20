import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";

const Home = () => {
  const [activeIcon, setActiveIcon] = useState("compass");

  const handleCompassClick = () => {
    console.log("Compass clicked");
    // Add any additional logic for the compass button here
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="pb-20"> {/* Add padding to avoid overlap with the footer */}
        <Outlet /> {/* This will render the nested routes like CaptainHome */}
      </div>

      {/* Footer */}
      <Footer
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        handleCompassClick={handleCompassClick}
      />
    </div>
  );
};

export default Home;
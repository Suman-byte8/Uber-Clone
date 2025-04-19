import React, { useState, useEffect, useCallback } from "react";
import Switcher12 from "../../components/Switcher12";
import { CiSearch } from "react-icons/ci";
import { CiSettings } from "react-icons/ci";
import { FaArrowTrendUp } from 'react-icons/fa6' 
import { CiCompass1 } from "react-icons/ci";
import LivePosition from "../../components/LivePosition";
import pfp from "../../../public/3464ad1c33c983b87d66f14b092f11ee.jpg";
import { Link } from "react-router-dom";

const CaptainHome = () => {
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [activeIcon, setActiveIcon] = useState('compass');
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      // Initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          setDriverLocation({ lat, lon });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Watch position for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          setDriverLocation({ lat, lon });
        },
        (error) => {
          console.error('Error watching location:', error);
        }
      );

      // Cleanup
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const toggleDriverStatus = () => {
    setIsDriverOnline((prev) => !prev);
  };

  const relocateToCurrentLocation = useCallback(() => {
    if (mapInstance && driverLocation) {
      mapInstance.setView([driverLocation.lat, driverLocation.lon], 15);
      console.log("Map recentered to:", driverLocation);
    } else {
      console.warn("Location or map instance is unavailable.");
    }
  }, [mapInstance, driverLocation]);

  const handleCompassClick = () => {
    setActiveIcon('compass');
    relocateToCurrentLocation();
  };

  return (
    <div className="w-full max-h-screen bg-gray-100">
      <nav className="fixed top-0 w-full p-3 py-2 flex items-center justify-between z-10 bg-white shadow-md">
        <Link to="profile" className="_profilePicture flex items-center justify-center">
          <img
            src={pfp}
            alt="Profile"
            className="w-12 h-12 rounded-full bg-gray-200"
          />
        </Link>

        <Switcher12 />

        <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
          <CiSearch />
        </div>
      </nav>

      {/* Main content area */}
      <div className="h-full w-full z-[1]">
        <LivePosition location={driverLocation} onMapReady={handleMapReady} />
      </div>
      {/* Main content area end */}

      <footer className="fixed bottom-0 w-full flex items-center justify-between p-4 bg-white z-10">
        <button 
          onClick={handleCompassClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            activeIcon === 'compass' 
              ? 'bg-blue-500 text-white text-xl' 
              : 'bg-white text-gray-500 text-lg'
          }`}
        >
          <CiCompass1 />
        </button>

        <button 
          onClick={() => setActiveIcon('trend')}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            activeIcon === 'trend' 
              ? 'bg-blue-500 text-white text-xl' 
              : 'bg-white text-gray-500 text-lg'
          }`}
        >
          <FaArrowTrendUp />
        </button>

        <button 
          onClick={() => setActiveIcon('settings')}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            activeIcon === 'settings' 
              ? 'bg-blue-500 text-white text-xl' 
              : 'bg-white text-gray-500 text-lg'
          }`}
        >
          <CiSettings />
        </button>
      </footer>
    </div>
  );
};

export default CaptainHome;

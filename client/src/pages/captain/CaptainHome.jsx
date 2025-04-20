import React, { useState, useEffect, useCallback } from "react";
import Switcher12 from "../../components/Switcher12";
import { CiSearch } from "react-icons/ci";
import { CiSettings } from "react-icons/ci";
import { FaArrowTrendUp } from "react-icons/fa6";
import { CiCompass1 } from "react-icons/ci";
import LivePosition from "../../components/LivePosition";
import pfp from "../../../public/3464ad1c33c983b87d66f14b092f11ee.jpg";
import { Link } from "react-router-dom";
import UserContext, { useUserContext } from "../../context/UserContext";
import axios from "axios";

import { useSocket } from "../../context/SocketContext";
import { updateLocation, acceptRide } from "../../socket/emitters";
import { onNewRideRequest } from "../../socket/listeners";

const CaptainHome = () => {
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [activeIcon, setActiveIcon] = useState("compass");
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const { captainId: contextCaptainId } = useUserContext();
  const captainId = localStorage.getItem("captainId") || contextCaptainId; // Use the ID from context if available;
  const token = localStorage.getItem("token");

  const socket = useSocket();

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await axios.put(
                `${
                  import.meta.env.VITE_BASE_URL
                }/api/captain/${captainId}/location`,
                {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            } catch (error) {
              console.error("Location update failed:", error);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            // Handle permission denied case
          }
        );
      }
    };

    if (captainId && token) {
      getLocation();
    }
  }, [captainId, token]);

  useEffect(() => {
    if (navigator.geolocation) {
      // Initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          setDriverLocation({ lat, lon });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );

      // Watch position for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          setDriverLocation({ lat, lon });
        },
        (error) => {
          console.error("Error watching location:", error);
        }
      );

      // Cleanup
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // Emit location updates via socket when driverLocation changes
  useEffect(() => {
    if (!socket) {
      console.log("Socket not available yet for location update.");
      return;
    }
    if (!socket.connected) {
      console.log("Socket not connected yet for location update.");
      return;
    }
    if (driverLocation) {
      console.log("Emitting location update via socket:", driverLocation);
      updateLocation({
        lat: driverLocation.lat,
        lon: driverLocation.lon,
        userId: captainId,
        role: "captain",
      });
    }
  }, [driverLocation, socket, captainId]);

  // Emit location update once when socket connects
  useEffect(() => {
    if (!socket) return;

    const onConnectHandler = () => {
      if (driverLocation) {
        console.log("Socket connected, emitting location update:", driverLocation);
        updateLocation({
          lat: driverLocation.lat,
          lon: driverLocation.lon,
          userId: captainId,
          role: "captain",
        });
      }
    };

    socket.on('connect', onConnectHandler);

    return () => {
      socket.off('connect', onConnectHandler);
    };
  }, [socket, driverLocation, captainId]);

  // Listen for new ride requests
  useEffect(() => {
    if (!socket) return;

    const removeListener = onNewRideRequest((ride) => {
      console.log("New ride request received:", ride);
      setIncomingRide(ride);
    });

    return () => {
      removeListener();
    };
  }, [socket]);

  const handleAcceptRide = () => {
    if (!incomingRide) return;
    acceptRide({
      rideId: incomingRide.rideId,
      captainId,
      captainLocation: driverLocation,
      estimatedArrival: 5, // example ETA in minutes
    });
    setIncomingRide(null);
  };

  const handleRejectRide = () => {
    // TODO: Implement rejectRide emitter similarly
    setIncomingRide(null);
  };

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
    setActiveIcon("compass");
    relocateToCurrentLocation();
  };

  return (
    <div className="w-full max-h-screen bg-gray-100">
      <nav className="fixed top-0 w-full p-3 py-2 flex items-center justify-between z-10 bg-white shadow-md">
        <Link
          to="profile"
          className="_profilePicture flex items-center justify-center"
        >
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

      {/* Incoming ride request modal */}
      {incomingRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">New Ride Request</h2>
            <p>Pickup: {incomingRide.rideDetails.pickupLocation?.address || "N/A"}</p>
            <p>Dropoff: {incomingRide.rideDetails.dropoffLocation?.address || "N/A"}</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={handleRejectRide}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptRide}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 w-full flex items-center justify-between p-4 bg-white z-10">
        <button
          onClick={handleCompassClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            activeIcon === "compass"
              ? "bg-blue-500 text-white text-xl"
              : "bg-white text-gray-500 text-lg"
          }`}
        >
          <CiCompass1 />
        </button>

        <button
          onClick={() => setActiveIcon("trend")}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            activeIcon === "trend"
              ? "bg-blue-500 text-white text-xl"
              : "bg-white text-gray-500 text-lg"
          }`}
        >
          <FaArrowTrendUp />
        </button>

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
    </div>
  );
};

export default CaptainHome;

import React, { useState, useEffect, useCallback } from "react";
import Switcher12 from "../../components/Switcher12";
import { CiSearch } from "react-icons/ci";
import { CiSettings } from "react-icons/ci";
import { FaHistory } from "react-icons/fa";
import { CiCompass1 } from "react-icons/ci";
import LivePosition from "../../components/LivePosition";
const pfp = "/3464ad1c33c983b87d66f14b092f11ee.jpg";
import { Link } from "react-router-dom";
import UserContext, { useUserContext } from "../../context/UserContext";
import axios from "axios";

import { useSocket } from "../../context/SocketContext";
import {
  updateLocation,
  acceptRide,
  registerCaptain,
  updateCaptainLocation,
  rejectRide,
  cancelRide,
} from "../../socket/emitters";
import { onNewRideRequest } from "../../socket/listeners";
import { useToast } from "../../context/ToastContext";
import CancellationModal from "../../components/CancellationModal"; // Import CancellationModal
import RideHistory from "../../components/RideHistory"; // Import RideHistory

const CaptainHome = () => {
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [activeIcon, setActiveIcon] = useState("compass");
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [riderDetails, setRiderDetails] = useState(null);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showDriverCancelConfirmModal, setShowDriverCancelConfirmModal] = useState(false); // For driver's own cancellation confirmation
  const [cancelReason, setCancelReason] = useState("");
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState("");
  const [showCancellationPopup, setShowCancellationPopup] = useState(false); // For the final "Ride Cancelled by X"
  const [cancellationPopupInitiator, setCancellationPopupInitiator] = useState(null); // 'driver' or 'rider'
  const [showRiderProfile, setShowRiderProfile] = useState(false);
  const [cancelAllowed, setCancelAllowed] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10); // 10-second timer
  const [rideHistory, setRideHistory] = useState([]); // Store ride history
  const [showHistoryPage, setShowHistoryPage] = useState(false); // Toggle history page
  const { captainId: contextCaptainId } = useUserContext();
  const captainId = localStorage.getItem("captainId") || contextCaptainId; // Use the ID from context if available;
  const token = localStorage.getItem("token");
  const { showToast } = useToast();

  const socket = useSocket();
  console.log("Socket instance in CaptainHome:", socket);

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
    if (driverLocation && captainId) {
      console.log(
        "Emitting captain location update via socket:",
        driverLocation
      );

      // Use the specialized captain location update emitter
      updateCaptainLocation(socket, {
        captainId,
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lon,
        },
      });
    }
  }, [driverLocation, socket, captainId]);

  // Emit location update once when socket connects
  useEffect(() => {
    if (!socket) return;

    const onConnectHandler = () => {
      if (driverLocation && captainId) {
        console.log(
          "Socket connected, emitting captain location update:",
          driverLocation
        );

        // Use the specialized captain location update emitter
        updateCaptainLocation(socket, {
          captainId,
          location: {
            lat: driverLocation.lat,
            lng: driverLocation.lon,
          },
        });
      }
    };

    socket.on("connect", onConnectHandler);

    return () => {
      socket.off("connect", onConnectHandler);
    };
  }, [socket, driverLocation, captainId]);

  // Register captain with socket server when socket connects
  useEffect(() => {
    if (!socket || !captainId) return;

    const handleConnect = () => {
      console.log("Socket connected, registering captain:", captainId);

      // Register captain with socket server
      registerCaptain(socket, {
        captainId,
        isActive: isDriverOnline,
        location: driverLocation
          ? {
              lat: driverLocation.lat,
              lng: driverLocation.lon,
            }
          : null,
      });
    };

    // Listen for socket connection events
    socket.on("connect", handleConnect);

    // If socket is already connected, register immediately
    if (socket.connected) {
      handleConnect();
    }

    // Listen for registration acknowledgment
    const handleRegistrationAcknowledged = (data) => {
      console.log("Captain registration acknowledged:", data);
    };

    socket.on("registrationAcknowledged", handleRegistrationAcknowledged);

    // Setup periodic re-registration to ensure connection is maintained
    const registrationInterval = setInterval(() => {
      if (socket && socket.connected && driverLocation) {
        console.log("Periodic captain re-registration");
        registerCaptain(socket, {
          captainId,
          isActive: isDriverOnline,
          location: driverLocation
            ? {
                lat: driverLocation.lat,
                lng: driverLocation.lon,
              }
            : null,
        });
      }
    }, 30000); // Re-register every 30 seconds

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("registrationAcknowledged", handleRegistrationAcknowledged);
      clearInterval(registrationInterval);
    };
  }, [socket, captainId, isDriverOnline, driverLocation]);

  // Listen for new ride requests
  useEffect(() => {
    if (!socket) return;

    // Track ride requests we've already seen to prevent duplicates
    const seenRideRequests = new Set();

    const handleNewRideRequest = (ride) => {
      // Prevent duplicate ride requests
      if (seenRideRequests.has(ride.rideId)) {
        console.log("Ignoring duplicate ride request:", ride.rideId);
        return;
      }

      // Add to seen set
      seenRideRequests.add(ride.rideId);

      console.log("New ride request received:", ride);

      // Show notification for new ride - DISABLED
      /*
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Ride Request', {
          body: `New ride request from ${ride.pickupLocation.address || 'a customer'}`,
          icon: '/notification-icon.png' // Add an icon to your public folder
        });
      }
      */

      // Fetch rider details
      if (ride.userId) {
        fetch(`${import.meta.env.VITE_BASE_URL}/api/user/${ride.userId}/public`)
          .then((res) => res.json())
          .then((response) => {
            if (response.success) {
              setRiderDetails({
                id: ride.userId,
                ...response.data,
              });
            }
          })
          .catch((err) => {
            console.error("Error fetching rider details:", err);
          });
      }

      setIncomingRide(ride);
      setShowRideModal(true);
    };

    // Listen for ride cancellations
    const handleRideCancelled = (data) => {
      console.log("Ride cancelled:", data);
      console.log("DRIVER_VIEW (CaptainHome): Received 'rideCancelled' event. Data:", JSON.stringify(data), "Current Ride:", JSON.stringify(currentRide), "Incoming Ride:", JSON.stringify(incomingRide));

      const rideMatchesCurrent = currentRide && currentRide.rideId === data.rideId;
      const rideMatchesIncoming = incomingRide && incomingRide.rideId === data.rideId;

      console.log("DRIVER_VIEW (CaptainHome): rideMatchesCurrent:", rideMatchesCurrent, "rideMatchesIncoming:", rideMatchesIncoming);
      if (rideMatchesCurrent || rideMatchesIncoming) {
        if (data.cancelledBy === 'rider') {
          console.log("Ride cancelled by rider (driver's home view)");
        }
        setCancellationPopupInitiator(data.cancelledBy); // 'rider' or 'driver'
        setShowCancellationPopup(true);

        if (rideMatchesCurrent) {
          setCurrentRide(null);
        }
        if (rideMatchesIncoming) {
          setIncomingRide(null);
          setShowRideModal(false);
        }
      } else if (data.cancelledBy === "user") { // Fallback for toast if not current/incoming
        // This might be redundant if the modal handles all cases
        // showToast("A ride was cancelled by the rider", "info");
        setCurrentRide(null);
      }
    };

    const handleUserRejected = (data) => {
      // Disconnect socket and show modal that user rejected
      if (socket && socket.connected) {
        socket.disconnect();
      }
      setCurrentRide(null);
      setShowRejectedModal(true);
      setRejectedMessage(
        "User rejected the ride. Please wait for a new ride request."
      );
    };

    const handleRideRejected = (data) => {
      setShowRejectedModal(true);
      setRejectedMessage(data.message || "Ride was rejected");
      setCurrentRide(null);
      setIncomingRide(null);
    };

    socket.on("newRideRequest", handleNewRideRequest);
    socket.on("rideCancelled", handleRideCancelled);
    socket.on("userRejected", handleUserRejected);
    socket.on("rideRejected", handleRideRejected);

    // Request notification permission - DISABLED
    /*
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    */

    return () => {
      socket.off("newRideRequest", handleNewRideRequest);
      socket.off("rideCancelled", handleRideCancelled);
      socket.off("userRejected", handleUserRejected);
      socket.off("rideRejected", handleRideRejected);
    };
  }, [socket, showToast, currentRide, incomingRide]);

  // --- Live Tracking: Listen for counterpartyLocation (user's location) ---
  useEffect(() => {
    if (!socket) return;

    const handleCounterpartyLocation = (data) => {
      // Only process if this is for the current ride
      if (
        currentRide &&
        data.rideId === currentRide.rideId &&
        data.role === "user"
      ) {
        setRiderDetails((prev) => ({
          ...(prev || {}),
          liveLocation: { lat: data.lat, lng: data.lng },
        }));
      }
    };

    socket.on("counterpartyLocation", handleCounterpartyLocation);
    return () => {
      socket.off("counterpartyLocation", handleCounterpartyLocation);
    };
  }, [socket, currentRide]);

  useEffect(() => {
    if (showRiderProfile) {
      const timer = setTimeout(() => setShowRiderProfile(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showRiderProfile]);

  useEffect(() => {
    if (!socket) return;

    socket.on("rideCancelled", (data) => {
      console.log(`${data.cancelledBy} cancelled the ride`);

      // Disconnect the socket
      socket.disconnect();

      // Reset the driver view
      setCurrentRide(null); // Clear the current ride details
      setIncomingRide(null); // Clear any incoming ride details
      setShowRideModal(false); // Close any open ride modal
      showToast("Ride has been cancelled by the rider", "error"); // Optional: Show a toast notification
    });

    return () => {
      socket.off("rideCancelled");
    };
  }, [socket]);

  useEffect(() => {
    if (currentRide && cancelAllowed) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCancelAllowed(false); // Disable cancel button after 10 seconds
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup timer on unmount
    } else {
      setCancelAllowed(true);
      setTimeLeft(10); // Reset timer when no ride is active
    }
  }, [currentRide, cancelAllowed]);

  const handleAcceptRide = () => {
    if (!incomingRide) return;

    console.log("Accepting ride:", incomingRide);
    console.log("Current rider details:", riderDetails);

    // Ensure we have rider details before accepting
    if (!riderDetails) {
      fetch(`${import.meta.env.VITE_BASE_URL}/api/user/${incomingRide.userId}`)
        .then((res) => res.json())
        .then((response) => {
          console.log("Fetched rider details:", response);
          if (response.success) {
            setRiderDetails({
              id: incomingRide.userId,
              ...response.data,
            });
          }
        })
        .catch((err) => {
          console.error("Error fetching rider details:", err);
        });
    }

    acceptRide(socket, {
      rideId: incomingRide.rideId,
      captainId,
      captainLocation: driverLocation
        ? {
            lat: driverLocation.lat,
            lng: driverLocation.lon,
          }
        : null,
      estimatedArrival: 5, // example ETA in minutes
    });

    // Add ride details to history
    setRideHistory((prevHistory) => [
      ...prevHistory,
      {
        time: Date.now(),
        fare: incomingRide.price,
        destination: incomingRide.dropoffLocation.address,
      },
    ]);

    // Set as current ride
    setCurrentRide(incomingRide);

    // Close the modal
    setShowRideModal(false);
    setIncomingRide(null);

    setShowRiderProfile(true);

    showToast("Ride accepted successfully", "success");
  };

  const handleRejectRide = () => {
    if (!incomingRide) return;

    rejectRide(socket, {
      rideId: incomingRide.rideId,
      captainId,
      reason: "Captain unavailable",
    });

    // Close the modal
    setShowRideModal(false);
    setIncomingRide(null);
  };

  const handleCancelRide = () => {
    if (!socket || !currentRide) return;

    // Emit the rideCancelled event
    socket.emit("rideCancelled", {
      rideId: currentRide.rideId,
      cancelledBy: "driver", // Specify that the driver canceled the ride
    });

    console.log("Ride cancelled by driver");

    // Reset the driver view
    setCurrentRide(null); // Clear the current ride details
    setIncomingRide(null); // Clear any incoming ride details
    setShowRideModal(false); // Close any open ride modal
    showToast("You have canceled the ride", "error"); // Optional: Show a toast notification
  };

  const handleMapReady = useCallback(
    (map) => {
      console.log("Map is ready:", map);
      setMapInstance(map);

      // If we already have a location, center the map
      if (driverLocation) {
        map.setView([driverLocation.lat, driverLocation.lon], 15);
      }
    },
    [driverLocation]
  );

  // Update map view when driver location changes
  useEffect(() => {
    if (mapInstance && driverLocation) {
      console.log("Updating map view to:", driverLocation);
      mapInstance.setView([driverLocation.lat, driverLocation.lon], 15);
    }
  }, [mapInstance, driverLocation]);

  const handleCompassClick = () => {
    setActiveIcon("compass");
    if (mapInstance && driverLocation) {
      mapInstance.setView([driverLocation.lat, driverLocation.lon], 15);
      console.log("Map recentered to:", driverLocation);
    } else {
      console.warn("Location or map instance is unavailable.");
    }
  };

  const toggleDriverStatus = async () => {
    try {
      // Toggle local state first for immediate UI feedback
      const newStatus = !isDriverOnline;
      setIsDriverOnline(newStatus);

      // Update status in database
      if (captainId && token) {
        console.log(
          `Updating captain status to ${newStatus ? "online" : "offline"}`
        );

        // Call API to update status in database
        const response = await axios.put(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/captain/${captainId}/toggle-status`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          // If socket is connected, update status via socket too
          if (socket && socket.connected) {
            // Re-register with new status
            registerCaptain(socket, {
              captainId,
              isActive: newStatus,
              location: driverLocation
                ? {
                    lat: driverLocation.lat,
                    lng: driverLocation.lon,
                  }
                : null,
            });
          }
        } else {
          // If API call failed, revert local state
          setIsDriverOnline(!newStatus);
        }
      }
    } catch (error) {
      console.error("Error toggling driver status:", error);
      // Revert local state on error
      setIsDriverOnline(!isDriverOnline);
    }
  };

  return (
    <div className="w-full max-h-screen bg-gray-100">
      {showHistoryPage ? (
        <RideHistory
          rides={rideHistory}
          onBack={() => setShowHistoryPage(false)} // Go back to home
        />
      ) : (
        <>
          {/* Existing CaptainHome content */}
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
          <div className="pt-16 pb-20">
            <LivePosition location={driverLocation} onMapReady={handleMapReady} />
          </div>

          {/* Ride request modal */}
          {showRideModal && incomingRide && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">New Ride Request</h2>

                {/* Rider details */}
                <div className="mb-4">
                  <h3 className="font-semibold">Rider Details:</h3>
                  <p>{riderDetails?.name || "Customer"}</p>
                  <p>{riderDetails?.phoneNumber || ""}</p>
                  <div className="flex items-center mt-1">
                    <div className="text-yellow-500 mr-1">★</div>
                    <span>{riderDetails?.rating || "4.5"}</span>
                  </div>
                </div>

                {/* Trip details */}
                <div className="mb-4">
                  <h3 className="font-semibold">Trip Details:</h3>
                  <div className="flex items-start mt-2">
                    <div className="min-w-[24px] mr-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mx-auto"></div>
                      <div className="w-0.5 h-10 bg-gray-300 mx-auto"></div>
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-2 line-clamp-1">
                        {incomingRide.pickupLocation.address || "Pickup location"}
                      </p>
                      <p className="text-sm line-clamp-1">
                        {incomingRide.dropoffLocation.address || "Dropoff location"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fare and distance */}
                <div className="flex justify-between mb-6">
                  <div>
                    <h3 className="font-semibold">Estimated Fare:</h3>
                    <p className="text-lg">₹{incomingRide.price || "0"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Distance:</h3>
                    <p className="text-lg">
                      {Math.round(incomingRide.distance || 0)} km
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handleRejectRide}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg w-[48%]"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptRide}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg w-[48%]"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current ride info */}
          {currentRide && (
            <div className="fixed bottom-20 left-0 right-0 bg-white shadow-lg rounded-t-lg p-4 z-20">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Current Ride</h3>
                <button
                  onClick={() => setShowDriverCancelConfirmModal(true)}
                  disabled={!cancelAllowed} // Disable button after 10 seconds
                  className={`text-sm ${cancelAllowed ? "text-red-500" : "text-gray-400 cursor-not-allowed"}`}
                >
                  Cancel Ride {cancelAllowed && `(${timeLeft}s)`} {/* Show timer */}
                </button>
              </div>

              <div className="flex items-start">
                <div className="min-w-[24px] mr-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto"></div>
                  <div className="w-0.5 h-10 bg-gray-300 mx-auto"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 mx-auto"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2 line-clamp-1">
                    {currentRide.pickupLocation.address || "Pickup location"}
                  </p>
                  <p className="text-sm line-clamp-1">
                    {currentRide.dropoffLocation.address || "Dropoff location"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-2">
                <div>
                  <span className="text-sm text-gray-600">Fare:</span>
                  <span className="font-semibold ml-1">
                    ₹{currentRide.price || "0"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Distance:</span>
                  <span className="font-semibold ml-1">
                  {Math.round(currentRide.distance || 0)} km
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Driver's confirmation modal for cancelling a ride */}
          {showDriverCancelConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-2">Cancel Ride</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel this ride?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDriverCancelConfirmModal(false)} // Close modal
                    className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      handleCancelRide(); // Call the cancel ride function
                      setShowDriverCancelConfirmModal(false); // Close modal
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generic "Ride Cancelled by X" Modal */}
          {showCancellationPopup && (
            <CancellationModal
              isOpen={showCancellationPopup}
              onClose={() => setShowCancellationPopup(false)}
              cancelledBy={cancellationPopupInitiator}
              isDriver={true} />
              
          )}

          {/* User rejected modal */}
          {showRejectedModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Ride Rejected</h3>
                <p className="mb-4">{rejectedMessage}</p>
                <button
                  className="w-full bg-black text-white py-2 rounded-lg"
                  onClick={() => setShowRejectedModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Rider profile modal */}
          {showRiderProfile && riderDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              {console.log("Rendering rider profile modal:", riderDetails)}
              <div className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-sm">
                <h2 className="text-xl font-semibold mb-4 text-center">
                  Rider Profile
                </h2>
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-2">
                    {riderDetails.name
                      ? riderDetails.name.charAt(0).toUpperCase()
                      : "R"}
                  </div>
                  <p className="font-medium text-lg">
                    {riderDetails.name || "Rider"}
                  </p>
                  <div className="flex items-center text-yellow-500 mt-1">
                    ★ <span className="ml-1">{riderDetails.rating || "4.5"}</span>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      {riderDetails.phoneNumber
                        ? `Phone: ${riderDetails.phoneNumber}`
                        : "Phone number not available"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRiderProfile(false)}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
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
              onClick={() => setShowHistoryPage(true)} // Show history page
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                activeIcon === "trend"
                  ? "bg-blue-500 text-white text-xl"
                  : "bg-white text-gray-500 text-lg"
              }`}
            >
              <FaHistory />
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
        </>
      )}
    </div>
  );
};

export default CaptainHome;

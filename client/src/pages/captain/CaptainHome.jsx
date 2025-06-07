import React, { useState, useEffect, useCallback } from "react";
import Switcher12 from "../../components/Switcher12";
import { CiSearch } from "react-icons/ci";
import { CiSettings } from "react-icons/ci";
import { FaHistory } from "react-icons/fa";
import { CiCompass1 } from "react-icons/ci";
import LivePosition from "../../components/LivePosition";
import { IoIosArrowForward } from "react-icons/io";
const pfp = "/3464ad1c33c983b87d66f14b092f11ee.jpg";
import { Link } from "react-router-dom";
import UserContext, { useUserContext } from "../../context/UserContext";
import axios from "axios";
import RideRequestPanel from "../../components/RideRequestPanel";
import Footer from "../captain/Footer";
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
import RideHistory from "./RideHistory"; // Import RideHistory
import Settings from "./Settings";

const CaptainHome = () => {
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [activeIcon, setActiveIcon] = useState("compass");
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [riderDetails, setRiderDetails] = useState(null);
  const [showDriverCancelConfirmModal, setShowDriverCancelConfirmModal] =
    useState(false); // For driver's own cancellation confirmation
  const [cancelReason, setCancelReason] = useState("");
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState("");
  const [showCancellationPopup, setShowCancellationPopup] = useState(false); // For the final "Ride Cancelled by X"
  const [cancellationPopupInitiator, setCancellationPopupInitiator] =
    useState(null); // 'driver' or 'rider'
  const [showRiderProfile, setShowRiderProfile] = useState(false);
  const [cancelAllowed, setCancelAllowed] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10); // 10-second timer
  const [isRidePanelExpanded, setIsRidePanelExpanded] = useState(false); // New state for ride panel expansion
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
      console.log(
        "DRIVER_VIEW (CaptainHome): Received 'rideCancelled' event. Data:",
        JSON.stringify(data),
        "Current Ride:",
        JSON.stringify(currentRide),
        "Incoming Ride:",
        JSON.stringify(incomingRide)
      );

      const rideMatchesCurrent =
        currentRide && currentRide.rideId === data.rideId;
      const rideMatchesIncoming =
        incomingRide && incomingRide.rideId === data.rideId;

      console.log(
        "DRIVER_VIEW (CaptainHome): rideMatchesCurrent:",
        rideMatchesCurrent,
        "rideMatchesIncoming:",
        rideMatchesIncoming
      );
      if (rideMatchesCurrent || rideMatchesIncoming) {
        if (data.cancelledBy === "rider") {
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
      } else if (data.cancelledBy === "user") {
        // Fallback for toast if not current/incoming
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
    } else if (!currentRide) {
      // Reset timer when no ride is active
      setCancelAllowed(true);
      setTimeLeft(10);
    }
  }, [currentRide]);

  const handleAcceptRide = () => {
    if (!incomingRide) return;

    acceptRide(socket, {
      rideId: incomingRide.rideId,
      captainId,
      captainLocation: driverLocation
        ? {
            lat: driverLocation.lat,
            lng: driverLocation.lon,
          }
        : null,
      estimatedArrival: 5, // Example ETA in minutes
    });

    // Ensure incomingRide has all required properties before setting it as currentRide
    if (
      incomingRide.pickupLocation &&
      incomingRide.dropoffLocation &&
      incomingRide.price
    ) {
      setCurrentRide(incomingRide);
    } else {
      console.error(
        "Incoming ride is missing required properties:",
        incomingRide
      );
    }

    setShowRideModal(false);
    setIncomingRide(null);
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

    // Show confirmation modal first
    setShowDriverCancelConfirmModal(true);
  };

  // Add new function to handle actual cancellation
  const confirmCancelRide = () => {
    if (!socket || !currentRide) return;

    cancelRide(socket, {
      rideId: currentRide.rideId,
      cancelledBy: "driver",
      reason: cancelReason || "Driver cancelled the ride",
    });

    // Close the confirmation modal
    setShowDriverCancelConfirmModal(false);

    // Show the cancellation notification modal
    setShowCancellationPopup(true);
    setCancellationPopupInitiator("driver");

    // Reset states
    setCurrentRide(null);
    setIncomingRide(null);
    setShowRideModal(false);
  };

  // Update map view when driver location changes
  useEffect(() => {
    if (mapInstance && driverLocation) {
      console.log("Updating map view to:", driverLocation);
      mapInstance.setView([driverLocation.lat, driverLocation.lon], 15);
    }
  }, [mapInstance, driverLocation]);

  const handleCompassClick = () => {
    setActiveIcon("compass");
    setShowHistoryPage(false); // Hide history page when compass is clicked
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

  // Add this function before the return statement, alongside other handler functions
  const handleMapReady = useCallback(
    (map) => {
      console.log("Map instance ready:", map);
      setMapInstance(map);

      // If we have driver location, center the map
      if (driverLocation) {
        map.setView([driverLocation.lat, driverLocation.lon], 15);
      }
    },
    [driverLocation]
  );

  return (
    
    <div className="w-full max-h-screen bg-gray-100 relative">
      {showHistoryPage ? (
        <RideHistory
          rides={rideHistory}
          onBack={() => setShowHistoryPage(false)}
        />
      ) : (
        <>
          <nav className="fixed top-0 w-full p-3 py-2 flex items-center justify-between z-10 bg-white shadow-md">
            <Link
              to="/captain-profile"
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

          {/* Main Content */}
          <div className="pt-16 pb-20 _mainContent">
            {activeIcon === "compass" && (
              <>
                <LivePosition
                  location={driverLocation}
                  onMapReady={handleMapReady}
                />
                {incomingRide && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                      <RideRequestPanel
                        ride={incomingRide}
                        onAccept={handleAcceptRide}
                        onReject={handleRejectRide}
                      />
                    </div>
                  </div>
                )}
                {showDriverCancelConfirmModal && (
                  <CancellationModal
                    isOpen={showDriverCancelConfirmModal}
                    onClose={() => setShowDriverCancelConfirmModal(false)}
                    cancelledBy="driver"
                    isDriver={true}
                  />
                )}
              </>
              )}
            
            {activeIcon === "trend" && <RideHistory />}
            {activeIcon === "settings" && <Settings />}
          </div>

          {showRideModal && incomingRide && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <RideRequestPanel
                  ride={incomingRide}
                  onAccept={handleAcceptRide}
                  onReject={handleRejectRide}
                  socket={socket}
                  captainId={captainId}
                />
              </div>
            </div>
          )}

          {currentRide && currentRide.pickupLocation && currentRide.dropoffLocation ? (
            <>
              {/* Dropdown Header */}
              {
                !isRidePanelExpanded ?  <div 
                onClick={() => setIsRidePanelExpanded(!isRidePanelExpanded)}
                className="fixed left-3 bottom-[8rem] z-30 flex items-center gap-2 bg-white rounded-lg shadow-md px-4 py-2 cursor-pointer hover:bg-gray-50 transition-all duration-300"
              >
                <div className={`flex items-center gap-2 ${isRidePanelExpanded ? 'text-blue-600' : 'text-gray-700'}`}>
                  <i className="ri-taxi-line text-lg" />
                  <span className="font-medium">Current Ride</span>
                </div>
                <i className={`ri-arrow-down-s-line text-xl transition-transform duration-300 ${
                  isRidePanelExpanded ? 'rotate-180 text-blue-600' : 'text-gray-500'
                }`} />
              </div>
              :<></>
              }
             

              {/* Expandable Panel */}
              <div
                className={`fixed left-0 right-0 bg-white shadow-lg transform transition-all duration-300 ease-in-out z-20 ${
                  isRidePanelExpanded 
                    ? 'translate-y-0 border-t border-gray-200' 
                    : 'translate-y-full'
                }`}
                style={{ bottom: '5rem' }}
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Ride Details</h3>
                  <button
                    onClick={() => setIsRidePanelExpanded(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="ri-close-line text-xl" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-4 space-y-4">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-map-pin-line text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Pickup Location</p>
                      <p className="text-gray-800">{currentRide.pickupLocation.address}</p>
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-flag-line text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Drop-off Location</p>
                      <p className="text-gray-800">{currentRide.dropoffLocation.address}</p>
                    </div>
                  </div>

                  {/* Fare Info */}
                  <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Total Fare</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{currentRide.price || 0}
                    </span>
                  </div>

                  {/* Cancel Button */}
                  <button
                    onClick={handleCancelRide}
                    disabled={!cancelAllowed}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                      cancelAllowed
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <i className="ri-close-circle-line" />
                    {cancelAllowed ? `Cancel Ride (${timeLeft}s)` : 'Cancel Disabled'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="fixed left-4 bottom-20 z-30">
              <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                <i className="ri-taxi-line" />
                <span>No active ride</span>
              </div>
            </div>
          )}

          {/* Driver Cancel Confirmation Modal */}
          <CancellationModal
            isOpen={showDriverCancelConfirmModal}
            onClose={() => setShowDriverCancelConfirmModal(false)}
            onConfirm={confirmCancelRide}
            cancelledBy="driver"
            isDriver={true}
          />

          {/* Cancellation Notification Modal */}
          <CancellationModal
            isOpen={showCancellationPopup}
            onClose={() => setShowCancellationPopup(false)}
            cancelledBy={cancellationPopupInitiator}
            isDriver={true}
            isNotification={true}
          />

          {/* Rejected Ride Modal */}
          {showRejectedModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Ride Rejected</h3>
                <p className="text-gray-600 mb-4">{rejectedMessage}</p>
                <button
                  onClick={() => setShowRejectedModal(false)}
                  className="w-full bg-black text-white py-2 rounded-lg"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Footer
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        handleCompassClick={handleCompassClick}
        setShowHistoryPage={setShowHistoryPage}
      />
    </div>
  );
};

export default CaptainHome;

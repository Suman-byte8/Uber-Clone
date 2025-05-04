import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
// Import the hooks for socket and user context
import { useSocket } from "../context/SocketContext";
import { useUserContext } from "../context/UserContext";
import CancelModal from "./CancelModal";
import NotificationModal from "./NotificationModal";
import DriverDetailsPanel from "./DriverDetailsPanel"; // Assuming this is a separate component

// Assuming pricingTiers structure is like:
// { car: { name: 'Comfort', maxPassengers: 4 }, auto: {...}, ... }

const ChooseRidePanel = ({
  onBack,
  isVisible,
  distance,
  prices,
  estimatedTime,
  pricingTiers,
  pickupData, // Expecting { lat, lng }
  dropoffData, // Expecting { lat, lng }
}) => {
  const contentRef = useRef(null);
  const panelRef = useRef(null);
  const [selectedRide, setSelectedRide] = useState(null); // e.g., 'car', 'auto'
  // Booking States: INITIAL, SEARCHING, FOUND, ACCEPTED, FAILED
  const [bookingState, setBookingState] = useState("INITIAL");
  const [errorMessage, setErrorMessage] = useState("");
  const [captainDetails, setCaptainDetails] = useState(null); // Store accepted captain info
  const [currentRideId, setCurrentRideId] = useState(null); // Store the ID of the requested ride
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelledBy, setCancelledBy] = useState(null);
  const [cancelAllowed, setCancelAllowed] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  useEffect(() => {
    console.log("showNotification state changed:", showNotification);
  }, [showNotification]);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Get socket instance and user ID from context
  const socket = useSocket();
  const { userId } = useUserContext(); // Make sure UserContext provides userId

  const isLoading = !distance || !estimatedTime || !prices?.car; // Keep your loading logic

  // --- Animation Effect (Keep as is) ---
  useEffect(() => {
    if (!contentRef.current || !panelRef.current) return;
    // ... your existing GSAP animation logic ...
  }, [isVisible]);

  // --- Socket Event Listeners ---
  useEffect(() => {
    if (!socket) {
      console.log("ChooseRidePanel: Socket not connected yet.");
      return; // Don't set up listeners if socket is not ready
    }

    // Register this user socket on server to receive ride events
    socket.emit("registerUser", { userId });

    // console.log("ChooseRidePanel: Setting up socket listeners.");

    const handleRideAccepted = (data) => {
      console.log("Ride Accepted with full details:", JSON.stringify(data));
      // Check if this acceptance is for the ride we requested
      if (data.rideId === currentRideId) {
        setCaptainDetails(data.captainDetails);
        setBookingState("ACCEPTED");
        setErrorMessage(""); // Clear any previous errors
      }
    };

    const handleRideRejected = (data) => {
      console.log("handleRideRejected event payload:", data);
      console.log("Ride Rejected:", data);
      // Could be rejected by a specific captain, maybe we wait for another or timeout
      // For simplicity now, we'll treat it as failure for this request
      if (data.rideId === currentRideId) {
        setNotificationTitle("Ride Rejected");
        setNotificationMessage(data.message || "The captain could not accept the ride.");
        setShowNotification(true);
        setBookingState("FAILED");
        setErrorMessage(
          "The captain could not accept the ride. Please try again."
        );
        setCurrentRideId(null); // Reset ride ID
      }
    };

    const handleNoCaptainsAvailable = (data) => {
      console.log("No Captains Available:", data);
      if (data.rideId === currentRideId) {
        setBookingState("FAILED");
        setErrorMessage(
          "No captains available nearby. Please try again later."
        );
        setCurrentRideId(null); // Reset ride ID
      }
    };

    const handleCaptainAssigned = (data) => {
      console.log("Captain Assigned:", data);
      if (data.rideId) {
        setCurrentRideId(data.rideId);
        setBookingState("SEARCHING");
        setErrorMessage("Captain assigned but not yet connected. Please wait.");
      }
    };

    const handleCaptainFound = (data) => {
      console.log("Captain Found:", data);
      if (data.rideId && data.captainId) {
        setCurrentRideId(data.rideId);
        setBookingState("FOUND");
        // Fetch captain details using the public endpoint
        fetch(`${import.meta.env.VITE_BASE_URL}/api/captain/${data.captainId}/public`)
          .then(res => res.json())
          .then(response => {
            if (response.success) {
              setCaptainDetails({
                id: data.captainId,
                ...response.data,
                estimatedArrival: data.estimatedArrival || 5
              });
            }
          })
          .catch(err => {
            console.error("Error fetching captain details:", err);
          });
      }
    };

    const handleCaptainLocationUpdate = (data) => {
      // Only process if a ride is accepted and the update is for our captain
      if (
        bookingState === "ACCEPTED" &&
        captainDetails &&
        data.captainId === captainDetails.id
      ) {
        console.log("Captain Location Update:", data.location);
      }
    };

    const handleRideCancelledByCaptain = (data) => {
      if (data.rideId === currentRideId) {
        setCancelledBy("captain");
        setShowCancelModal(true);
        setBookingState("INITIAL");
        setCaptainDetails(null);
        setCurrentRideId(null);
      }
    };

    // Register listeners
    socket.on("rideAccepted", handleRideAccepted);
    socket.on("rideRejected", handleRideRejected); // Assuming server sends this
    socket.on("noCaptainsAvailable", handleNoCaptainsAvailable); // Assuming server sends this
    socket.on("captainAssigned", handleCaptainAssigned);
    socket.on("captainFound", handleCaptainFound);
    socket.on("captainLocationUpdate", handleCaptainLocationUpdate);
    socket.on("rideCancelledByCaptain", handleRideCancelledByCaptain);

    // Cleanup listeners on component unmount or socket change
    return () => {
      console.log("ChooseRidePanel: Cleaning up socket listeners.");
      socket.off("rideAccepted", handleRideAccepted);
      socket.off("rideRejected", handleRideRejected);
      socket.off("noCaptainsAvailable", handleNoCaptainsAvailable);
      socket.off("captainAssigned", handleCaptainAssigned);
      socket.off("captainFound", handleCaptainFound);
      socket.off("captainLocationUpdate", handleCaptainLocationUpdate);
      socket.off("rideCancelledByCaptain", handleRideCancelledByCaptain);
    };
    // Rerun this effect if the socket instance changes
  }, [socket, currentRideId, bookingState, captainDetails, userId]); // Add dependencies that handlers rely on

  useEffect(() => {
    if (bookingState === "ACCEPTED") {
      setCancelAllowed(true);
      const timer = setTimeout(() => setCancelAllowed(false), 10000);
      return () => clearTimeout(timer);
    } else {
      setCancelAllowed(true);
    }
  }, [bookingState]);

  const handleUserCancel = () => {
    if (!cancelAllowed || !currentRideId) return;
    socket.emit("cancelRide", { rideId: currentRideId });
    setCancelledBy("user");
    setShowCancelModal(true);
    setBookingState("INITIAL");
    setCaptainDetails(null);
    setCurrentRideId(null);
  };

  // --- Helper Functions ---
  const formatTime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60); // Use Math.round for cleaner display
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEstimatedArrivalTime = () => {
    if (!estimatedTime) return "";
    const now = new Date();
    now.setMinutes(now.getMinutes() + estimatedTime);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --- Ride Booking ---
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      // Use Nominatim API directly from the client
      // Note: For production, it's better to proxy this through your server
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en', // Get results in English
            'User-Agent': 'UberClone/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch address');
      
      const data = await response.json();
      console.log("Nominatim response:", data);
      
      // Extract a meaningful address from the response
      if (data.display_name) {
        // Often the display_name is too verbose, so we can extract parts
        const parts = data.display_name.split(', ');
        // Take first 2-3 parts for a more concise address
        return parts.slice(0, 3).join(', ');
      } else if (data.address) {
        // Build address from components
        const addressParts = [];
        const address = data.address;
        
        // Try to build a meaningful address from components
        if (address.road || address.pedestrian || address.neighbourhood) 
          addressParts.push(address.road || address.pedestrian || address.neighbourhood);
        if (address.suburb) addressParts.push(address.suburb);
        if (address.city || address.town || address.village) 
          addressParts.push(address.city || address.town || address.village);
        
        if (addressParts.length > 0) {
          return addressParts.join(', ');
        }
      }
      
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error fetching address:', error);
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Modify the handleBookRide function to use the address information that should already be available
  const handleBookRide = async () => {
    // Basic validation
    if (
      !selectedRide ||
      !userId ||
      !pickupData ||
      !dropoffData
    ) {
      console.error("Cannot book ride: Missing required ride information", {
        selectedRide,
        userId,
        pickupData,
        dropoffData,
      });
      setErrorMessage("Could not request ride. Please check all fields are filled.");
      return;
    }

    // Check socket connection
    if (!socket) {
      console.error("Socket not connected. Attempting to reconnect...");
      setErrorMessage("Connection issue. Please wait a moment and try again.");
      return;
    }

    if (bookingState === "INITIAL" || bookingState === "FAILED") {
      setBookingState("SEARCHING");
      setErrorMessage(""); // Clear previous errors
      setCaptainDetails(null); // Clear previous captain details

      try {
        // Fetch actual addresses using reverse geocoding
        const [pickupAddress, dropoffAddress] = await Promise.all([
          fetchAddressFromCoordinates(pickupData.lat, pickupData.lng),
          fetchAddressFromCoordinates(dropoffData.lat, dropoffData.lng)
        ]);

        console.log("Resolved addresses:", { pickupAddress, dropoffAddress });

        const rideDetails = {
          userId: userId,
          pickupLocation: {
            lat: pickupData.lat,
            lng: pickupData.lng,
            address: pickupAddress
          },
          dropoffLocation: {
            lat: dropoffData.lat,
            lng: dropoffData.lng,
            address: dropoffAddress
          },
          rideType: selectedRide,
          price: prices[selectedRide],
          distance: distance,
          estimatedTime: estimatedTime,
        };

        console.log("Emitting 'requestRide':", rideDetails);

        // Emit the ride request to the server
        socket.emit("requestRide", rideDetails, (response) => {
          if (response?.status === "received" && response?.rideId) {
            console.log("Ride request received by server, ride ID:", response.rideId);
            setCurrentRideId(response.rideId);
          } else if (response?.status === "error") {
            console.error("Server error processing ride request:", response.message);
            setBookingState("FAILED");
            setErrorMessage(response.message || "Server error. Please try again.");
          }
        });
      } catch (error) {
        console.error("Error preparing ride request:", error);
        setBookingState("FAILED");
        setErrorMessage("Failed to get location details. Please try again.");
      }
    }
  };

  // Helper function to extract the best available address from location data
  const extractAddressFromLocationData = (locationData) => {
    // Log the full object to see what's available
    console.log("Extracting address from:", locationData);
    
    // Try different possible address fields
    if (typeof locationData === 'object' && locationData !== null) {
      // If it has a display_name property (common in OpenStreetMap responses)
      if (locationData.display_name) {
        return locationData.display_name;
      }
      
      // If it has a formatted_address property (common in Google Maps responses)
      if (locationData.formatted_address) {
        return locationData.formatted_address;
      }
      
      // If it has a name property
      if (locationData.name) {
        return locationData.name;
      }
      
      // If it has an address property that's a string
      if (typeof locationData.address === 'string') {
        return locationData.address;
      }
      
      // If it has an address property that's an object (common in some APIs)
      if (typeof locationData.address === 'object' && locationData.address !== null) {
        const addressParts = [];
        const address = locationData.address;
        
        // Try to build an address from components
        if (address.road) addressParts.push(address.road);
        if (address.house_number) addressParts.push(address.house_number);
        if (address.suburb) addressParts.push(address.suburb);
        if (address.city || address.town) addressParts.push(address.city || address.town);
        if (address.state) addressParts.push(address.state);
        
        if (addressParts.length > 0) {
          return addressParts.join(', ');
        }
      }
      
      // If it has a place_name property (common in Mapbox responses)
      if (locationData.place_name) {
        return locationData.place_name;
      }
    }
    
    // If we have lat/lng, create a simple address format
    if (locationData.lat && (locationData.lng || locationData.lon)) {
      const lat = locationData.lat;
      const lng = locationData.lng || locationData.lon;
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    
    // Fallback
    return "Location details unavailable";
  };

  // --- Back Button Logic ---
  const handleBack = () => {
    if (bookingState === "SEARCHING" || bookingState === "ACCEPTED") {
      // TODO: Implement ride cancellation logic if needed
      // socket.emit('cancelRide', { rideId: currentRideId });
      console.log("Need to implement ride cancellation");
    }
    // Reset state when going back
    setBookingState("INITIAL");
    setErrorMessage("");
    setCaptainDetails(null);
    setSelectedRide(null);
    setCurrentRideId(null);
    onBack(); // Call the original onBack prop
  };

  return (
    <>
      <NotificationModal open={showNotification} title={notificationTitle} message={notificationMessage} onClose={() => setShowNotification(false)} />
      <CancelModal
        open={showCancelModal}
        cancelledBy={cancelledBy}
        onSubmit={(rating) => { console.log("Rating submitted:", rating); setShowCancelModal(false); }}
        onClose={() => setShowCancelModal(false)}
      />
      <div
        ref={panelRef}
        className={`fixed inset-0 bg-white z-50 transition-transform duration-500 ease-out ${isVisible ? "translate-y-0" : "translate-y-full"
          }`}
      >
        {/* Show Driver Details Panel if ride is accepted */}
        {bookingState === "ACCEPTED" && captainDetails ? (
          <DriverDetailsPanel
            driver={captainDetails}
            onCancel={handleUserCancel}
            onBack={handleBack} // Allow going back from driver details
            cancelAllowed={cancelAllowed}
          />
        ) : (
          /* Show Ride Selection / Searching Panel */
          <div ref={contentRef} className="p-4 h-full flex flex-col">
            <button
              onClick={handleBack} // Use the modified back handler
              className="flex items-center text-gray-600 mb-4 hover:text-gray-800"
            >
              <i className="ri-arrow-left-line text-2xl mr-2"></i>
              Back
            </button>

            {isLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                <span className="text-xl font-medium text-gray-600 mb-2">
                  Calculating route...
                </span>
                <span className="text-sm text-gray-500">
                  Please wait a moment
                </span>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{distance?.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium">
                      {formatTime(estimatedTime)}
                    </span>
                  </div>
                </div>

                <div className="_rides w-full px-2 flex-grow overflow-y-auto">
                  {["car", "auto", "motorcycle"].map(
                    (type) =>
                      prices[type] &&
                      pricingTiers[type] && ( // Ensure price and tier data exists
                        <div
                          key={type}
                          onClick={() =>
                            bookingState !== "SEARCHING" && setSelectedRide(type)
                          } // Allow selection only if not searching
                          className={`flex items-center justify-between border-b py-3 transition-all duration-300 ${selectedRide === type
                              ? "bg-gray-200 shadow-inner px-2 rounded"
                              : "hover:bg-gray-100 px-2"
                            } ${bookingState === "SEARCHING"
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                type === "car"
                                  ? "https://i.pinimg.com/736x/8d/21/7b/8d217b1000b642005fea7b6fd6c3d967.jpg" // Use relative paths from public folder
                                  : type === "auto"
                                    ? "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png"
                                    : "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648177797/assets/fc/ddecaa-2eee-48fe-87f0-614aa7cee7d3/original/Uber_Moto_312x208_pixels_Mobile.png"
                              }
                              alt={`${type} icon`}
                              className="w-16 h-auto object-contain" // Adjusted size
                            />
                            <div>
                              <h4 className="text-lg font-semibold flex items-center gap-1">
                                {pricingTiers[type].name}
                                <i className="ri-user-fill text-xs font-normal"></i>
                                <span className="text-xs font-normal">
                                  {pricingTiers[type].maxPassengers}
                                </span>
                              </h4>
                              <p className="text-xs text-gray-600">
                                {getEstimatedArrivalTime()} arrival
                              </p>
                            </div>
                          </div>
                          <h2 className="text-lg font-medium">₹{prices[type]}</h2>
                        </div>
                      )
                  )}
                </div>

                {/* Error Message Display */}
                {errorMessage && (
                  <div className="my-2 p-2 text-center text-red-600 bg-red-100 rounded">
                    {errorMessage}
                  </div>
                )}

                <button
                  className={`w-full mt-auto mb-4 p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${selectedRide &&
                      (bookingState === "INITIAL" || bookingState === "FAILED")
                      ? "bg-black text-white hover:bg-gray-800"
                      : bookingState === "SEARCHING"
                        ? "bg-yellow-500 text-black cursor-wait" // Indicate searching
                        : bookingState === "FOUND"
                          ? "bg-green-500 text-white cursor-pointer" // Indicate found
                          : "bg-gray-300 text-gray-500 cursor-not-allowed" // Disabled state
                    }`}
                  disabled={!selectedRide || bookingState === "SEARCHING"}
                  onClick={handleBookRide}
                >
                  {bookingState === "INITIAL" &&
                    `Book ${selectedRide ? pricingTiers[selectedRide]?.name : "a ride"
                    }`}
                  {bookingState === "SEARCHING" && "Finding your driver..."}
                  {bookingState === "FOUND" && "Driver found!"}
                  {bookingState === "FAILED" &&
                    `Retry Booking ${selectedRide ? pricingTiers[selectedRide]?.name : ""
                    }`}
                  {/* Button text handled by showing DriverDetailsPanel when ACCEPTED */}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};


export default ChooseRidePanel;

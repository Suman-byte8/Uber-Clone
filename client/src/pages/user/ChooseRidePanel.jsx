import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import axios from "axios"; // Import axios for HTTP requests
// Import the hooks for socket and user context
import { useSocket, useSocketActions } from "../../context/SocketContext";
import { useUserContext } from "../../context/UserContext";
import NotificationModal from "../../components/Modals/NotificationModal";
import CancellationModal from "../../components/Modals/CancellationModal"; // Import the correct modal
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
  pickupData,
  dropoffData,
}) => {
  const contentRef = useRef(null);
  const panelRef = useRef(null);
  const [selectedRide, setSelectedRide] = useState(null); // e.g., 'car', 'auto'
  // Booking States: INITIAL, SEARCHING, FOUND, ACCEPTED, FAILED
  const [bookingState, setBookingState] = useState("INITIAL");
  const [errorMessage, setErrorMessage] = useState("");
  const [captainDetails, setCaptainDetails] = useState(null); // Store accepted captain info
  const [currentRideId, setCurrentRideId] = useState(null); // Store the ID of the requested ride
  const [showCancellationInfoModal, setShowCancellationInfoModal] =
    useState(false);
  const [cancellationInfoSource, setCancellationInfoSource] = useState(null); // 'rider' or 'driver'
  const [cancelAllowed, setCancelAllowed] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showDriverCancelledModal, setShowDriverCancelledModal] =
    useState(false);

  useEffect(() => {
    console.log("showNotification state changed:", showNotification);
  }, [showNotification]);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Get socket instance and user ID from context
  const socket = useSocket();
  const { forceReconnectSocket, isConnected, reconnecting } =
    useSocketActions();
  const { userId } = useUserContext(); // Make sure UserContext provides userId

  const isLoading = !distance || !estimatedTime || !prices?.car; // Keep your loading logic

  // Function to handle socket reconnection
  const handleSocketReconnection = useCallback(async () => {
    if (reconnecting) return; // Prevent multiple reconnection attempts

    console.log("Attempting to reconnect socket...");

    try {
      await forceReconnectSocket();
      console.log("Socket reconnected successfully");
    } catch (error) {
      console.error("Failed to reconnect socket:", error);
      setErrorMessage("Connection lost. Please try again.");
    }
  }, [forceReconnectSocket, reconnecting]);

  // --- Animation Effect (Keep as is) ---
  useEffect(() => {
    if (!contentRef.current || !panelRef.current || !showPanel) return;

    const panel = panelRef.current;
    const content = contentRef.current;

    gsap.set(content, { opacity: 0, y: 20 });

    if (isVisible) {
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        delay: 0.2,
        ease: "power2.out",
      });
    }
  }, [isVisible, showPanel]);

  // --- Socket Event Listeners ---
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(
        "ChooseRidePanel: Socket not connected yet. Connected:",
        isConnected
      );
      return; // Don't set up listeners if socket is not ready
    }

    console.log(
      "ChooseRidePanel: Setting up socket listeners with connected socket"
    );

    // Register this user socket on server to receive ride events
    socket.emit("registerUser", { userId });


    const handleRideRejected = (data) => {
      console.log("handleRideRejected event payload:", data);
      console.log("Ride Rejected:", data);
      // Could be rejected by a specific captain, maybe we wait for another or timeout
      // For simplicity now, we'll treat it as failure for this request
      if (data.rideId === currentRideId) {
        setNotificationTitle("Ride Rejected");
        setNotificationMessage(
          data.message || "The captain could not accept the ride."
        );
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
        fetch(
          `${import.meta.env.VITE_BASE_URL}/api/captain/${
            data.captainId
          }/public`
        )
          .then((res) => res.json())
          .then((response) => {
            if (response.success) {
              setCaptainDetails({
                id: data.captainId,
                ...response.data,
                estimatedArrival: data.estimatedArrival || 5,
              });
            }
          })
          .catch((err) => {
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

    const handleRideCancelled = (data) => {
      console.log(
        "RIDER_VIEW (ChooseRidePanel): Received 'rideCancelled' event. Data:",
        JSON.stringify(data),
        "Current Ride ID:",
        currentRideId
      );

      if (data.rideId === currentRideId) {
        console.log(
          "RIDER_VIEW (ChooseRidePanel): rideId matches currentRideId."
        );

        if (data.cancelledBy === "driver") {
          console.log("Ride cancelled by driver (rider's view)");

          // Show notification modal for driver cancellation
          setNotificationTitle("Ride Cancelled");
          setNotificationMessage("The Driver Cancelled the ride, Try again!");
          setShowNotification(true);

          // Handle socket reconnection after showing notification
          setTimeout(async () => {
            console.log(
              "Initiating socket reconnection after driver cancellation"
            );
            await handleSocketReconnection();
          }, 2000); // Give time for notification to be seen
        }

        setCancellationInfoSource(data.cancelledBy); // 'driver' or 'rider'

        // Reset all ride states
        setBookingState("INITIAL");
        setCaptainDetails(null);
        setCurrentRideId(null);
        setErrorMessage("");
      }
    };

    // Register listeners
    // socket.on("rideAccepted", handleRideAccepted);
    socket.on("rideRejected", handleRideRejected); // Assuming server sends this
    socket.on("noCaptainsAvailable", handleNoCaptainsAvailable); // Assuming server sends this
    socket.on("captainAssigned", handleCaptainAssigned);
    socket.on("captainFound", handleCaptainFound);
    socket.on("captainLocationUpdate", handleCaptainLocationUpdate);
    socket.on("rideCancelled", handleRideCancelled);

    // Cleanup listeners on component unmount or socket change
    return () => {
      console.log("ChooseRidePanel: Cleaning up socket listeners.");
      // socket.off("rideAccepted", handleRideAccepted);
      socket.off("rideRejected", handleRideRejected);
      socket.off("noCaptainsAvailable", handleNoCaptainsAvailable);
      socket.off("captainAssigned", handleCaptainAssigned);
      socket.off("captainFound", handleCaptainFound);
      socket.off("captainLocationUpdate", handleCaptainLocationUpdate);
      socket.off("rideCancelled", handleRideCancelled);
    };
    // Rerun this effect if the socket instance changes
  }, [
    socket,
    currentRideId,
    bookingState,
    captainDetails,
    userId,
    handleSocketReconnection,
  ]); // Add dependencies that handlers rely on
  useEffect(() => {
    console.log("Current state:", {
      bookingState,
      captainDetails,
      currentRideId,
      showPanel: !!panelRef.current
    });
  }, [bookingState, captainDetails, currentRideId]);
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
    socket.emit("cancelRide", {
      rideId: currentRideId,
      cancelledBy: "rider",
      userId,
      captainId: captainDetails?.id,
    });
    setCancellationInfoSource("rider");
    setShowCancellationInfoModal(true);
    setBookingState("INITIAL");
    setErrorMessage("");
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
            "Accept-Language": "en", // Get results in English
            "User-Agent": "UberClone/1.0", // Required by Nominatim
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      console.log("Nominatim response:", data);

      // Extract a meaningful address from the response
      if (data.display_name) {
        // Often the display_name is too verbose, so we can extract parts
        const parts = data.display_name.split(", ");
        // Take first 2-3 parts for a more concise address
        return parts.slice(0, 3).join(", ");
      } else if (data.address) {
        // Build address from components
        const addressParts = [];
        const address = data.address;

        // Try to build a meaningful address from components
        if (address.road || address.pedestrian || address.neighbourhood)
          addressParts.push(
            address.road || address.pedestrian || address.neighbourhood
          );
        if (address.suburb) addressParts.push(address.suburb);
        if (address.city || address.town || address.village)
          addressParts.push(address.city || address.town || address.village);

        if (addressParts.length > 0) {
          return addressParts.join(", ");
        }
      }

      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Error fetching address:", error);
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Modify the handleBookRide function to use the address information that should already be available
  const handleBookRide = async () => {
    // Basic validation
    if (!selectedRide || !userId || !pickupData || !dropoffData) {
      console.error("Cannot book ride: Missing required ride information", {
        selectedRide,
        userId,
        pickupData,
        dropoffData,
      });
      setErrorMessage(
        "Could not request ride. Please check all fields are filled."
      );
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
          fetchAddressFromCoordinates(dropoffData.lat, dropoffData.lng),
        ]);

        console.log("Resolved addresses:", { pickupAddress, dropoffAddress });

        // Fetch rider details
        let riderInfo = { name: "User", photo: null, phone: null, rating: null };
        
        try {
          const riderResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/user/${userId}/public`
          );
          
          console.log("Rider API response:", riderResponse.data);
          
          // Check the structure of the response and extract rider details
          if (riderResponse.data && riderResponse.data.user) {
            riderInfo = {
              name: riderResponse.data.user.name || "User",
              photo: riderResponse.data.user.photo || null,
              phone: riderResponse.data.user.phone || riderResponse.data.user.phoneNumber || null,
              rating: riderResponse.data.user.rating || null
            };
          } else if (riderResponse.data) {
            // If the user object is directly in the data
            riderInfo = {
              name: riderResponse.data.name || "User",
              photo: riderResponse.data.photo || null,
              phone: riderResponse.data.phone || riderResponse.data.phoneNumber || null,
              rating: riderResponse.data.rating || null
            };
          }
        } catch (userError) {
          console.error("Error fetching user details:", userError);
          // Continue with default rider info
        }

        const rideDetails = {
          userId: userId,
          rider: riderInfo,
          pickupLocation: {
            lat: pickupData.lat,
            lng: pickupData.lng,
            address: pickupAddress,
          },
          dropoffLocation: {
            lat: dropoffData.lat,
            lng: dropoffData.lng,
            address: dropoffAddress,
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
            console.log(
              "Ride request received by server, ride ID:",
              response.rideId
            );
            setCurrentRideId(response.rideId);
          } else if (response?.status === "error") {
            console.error(
              "Server error processing ride request:",
              response.message
            );
            setBookingState("FAILED");
            setErrorMessage(
              response.message || "Server error. Please try again."
            );
          }
        });
      } catch (error) {
        console.error("Error preparing ride request:", error);
        setErrorMessage("Failed to get location details. Please try again.");
        setBookingState("FAILED");
      }
    }
  };

  // // Helper function to extract the best available address from location data
  // const extractAddressFromLocationData = (locationData) => {
  //   // Log the full object to see what's available
  //   console.log("Extracting address from:", locationData);

  //   // Try different possible address fields
  //   if (typeof locationData === 'object' && locationData !== null) {
  //     // If it has a display_name property (common in OpenStreetMap responses)
  //     if (locationData.display_name) {
  //       return locationData.display_name;
  //     }

  //     // If it has a formatted_address property (common in Google Maps responses)
  //     if (locationData.formatted_address) {
  //       return locationData.formatted_address;
  //     }

  //     // If it has a name property
  //     if (locationData.name) {
  //       return locationData.name;
  //     }

  //     // If it has an address property that's a string
  //     if (typeof locationData.address === 'string') {
  //       return locationData.address;
  //     }

  //     // If it has an address property that's an object (common in some APIs)
  //     if (typeof locationData.address === 'object' && locationData.address !== null) {
  //       const addressParts = [];
  //       const address = locationData.address;

  //       // Try to build an address from components
  //       if (address.road) addressParts.push(address.road);
  //       if (address.house_number) addressParts.push(address.house_number);
  //       if (address.suburb) addressParts.push(address.suburb);
  //       if (address.city || address.town) addressParts.push(address.city || address.town);
  //       if (address.state) addressParts.push(address.state);

  //       if (addressParts.length > 0) {
  //         return addressParts.join(', ');
  //       }
  //     }

  //     // If it has a place_name property (common in Mapbox responses)
  //     if (locationData.place_name) {
  //       return locationData.place_name;
  //     }
  //   }

  //   // If we have lat/lng, create a simple address format
  //   if (locationData.lat && (locationData.lng || locationData.lon)) {
  //     const lat = locationData.lat;
  //     const lng = locationData.lng || locationData.lon;
  //     return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  //   }

  //   // Fallback
  //   return "Location details unavailable";
  // };

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

  // Add this useEffect for the delayed render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPanel(true);
    }, 10000); // 10 seconds delay

    return () => clearTimeout(timer);
  }, []);

  // Update the LoadingScreen component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
      <span className="text-xl font-medium text-gray-600 mb-2">
        Preparing your ride options...
      </span>
    </div>
  );

  // Add this to ChooseRidePanel.jsx where ride is requested
  const emitLocation = (location) => {
    if (socket && currentRideId) {
      socket.emit("locationUpdate", {
        rideId: currentRideId,
        role: "user",
        location: {
          lat: location.lat,
          lon: location.lon,
          address: location.address,
        },
      });
    }
  };

  // Add this useEffect to continuously update location
  useEffect(() => {
    if (!currentRideId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        try {
          // Get address for the location
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lon}`
          );
          location.address = response.data.display_name;
        } catch (error) {
          console.error("Error getting address:", error);
        }

        emitLocation(location);
      },
      (error) => console.error("Error watching location:", error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentRideId, socket]);

  useEffect(() => {
    if (!socket) {
      console.log("🚕 RIDER_VIEW: Socket not available");
      return;
    }
  
    console.log("🚕 RIDER_VIEW: Setting up socket listeners for ride responses");
    console.log("🚕 RIDER_VIEW: Current ride ID:", currentRideId);
  
    const handleRideAccepted = (data) => {
      console.log("🎉 RIDER_VIEW: ===== RIDE ACCEPTED EVENT RECEIVED =====");
      console.log("🎉 RIDER_VIEW: Full data received:", JSON.stringify(data, null, 2));
      console.log("🎉 RIDER_VIEW: Event ride ID:", data.rideId);
      console.log("🎉 RIDER_VIEW: Current ride ID:", currentRideId);
      
      if (data.rideId === currentRideId) {
        console.log("🎉 RIDER_VIEW: Ride IDs match! Updating booking state to ACCEPTED");
        console.log("🎉 RIDER_VIEW: Previous booking state:", bookingState);
        
        setBookingState("ACCEPTED");
        
        if (data.captainDetails) {
          console.log("🎉 RIDER_VIEW: Updating captain details:", data.captainDetails);
          setCaptainDetails(prev => ({
            ...prev,
            ...data.captainDetails
          }));
        }
        
        console.log("🎉 RIDER_VIEW: Booking state updated to ACCEPTED");
      } else {
        console.log("🚕 RIDER_VIEW: Ride IDs don't match, ignoring event");
      }
    };
  
    const handleRideRejected = (data) => {
      console.log("❌ RIDER_VIEW: ===== RIDE REJECTED EVENT RECEIVED =====");
      console.log("❌ RIDER_VIEW: Full data received:", JSON.stringify(data, null, 2));
      console.log("❌ RIDER_VIEW: Event ride ID:", data.rideId);
      console.log("❌ RIDER_VIEW: Current ride ID:", currentRideId);
      
      if (data.rideId === currentRideId) {
        console.log("❌ RIDER_VIEW: Ride IDs match! Driver rejected the ride");
        console.log("❌ RIDER_VIEW: Resetting to search for another driver");
        
        setBookingState("SEARCHING");
        setCaptainDetails(null);
      } else {
        console.log("❌ RIDER_VIEW: Ride IDs don't match, ignoring event");
      }
    };
  
    const handleAllSocketEvents = (eventName) => {
      return (data) => {
        console.log(`🔔 RIDER_VIEW: Socket event '${eventName}' received:`, data);
      };
    };
  
    // Listen for ride acceptance and rejection events
    socket.on("rideAccepted", handleRideAccepted);
    socket.on("rideRejected", handleRideRejected);
    
    // Debug: Listen to all socket events
    socket.on("connect", () => console.log("🔌 RIDER_VIEW: Socket connected"));
    socket.on("disconnect", () => console.log("🔌 RIDER_VIEW: Socket disconnected"));
    socket.on("error", handleAllSocketEvents("error"));
  
    return () => {
      console.log("🚕 RIDER_VIEW: Cleaning up socket listeners");
      socket.off("rideAccepted", handleRideAccepted);
      socket.off("rideRejected", handleRideRejected);
    };
  }, [socket, currentRideId, bookingState]);
  
// Add this useEffect to track state changes
useEffect(() => {
  console.log("📊 RIDER_VIEW: State changed:");
  console.log("📊 RIDER_VIEW: - Booking State:", bookingState);
  console.log("📊 RIDER_VIEW: - Current Ride ID:", currentRideId);
  console.log("📊 RIDER_VIEW: - Captain Details:", captainDetails);
  console.log("📊 RIDER_VIEW: - Show Panel:", showPanel);
}, [bookingState, currentRideId, captainDetails, showPanel]);


// Also add this to see all socket events



  return (
    <>
      {!showPanel ? (
        <LoadingScreen />
      ) : (
        <>
          <NotificationModal
            open={showNotification}
            title={notificationTitle}
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
          />
          <CancellationModal
            isOpen={showCancellationInfoModal}
            onClose={() => {
              setShowCancellationInfoModal(false);
              setBookingState("INITIAL");
              setErrorMessage("");
              setCaptainDetails(null);
              setCurrentRideId(null);
            }}
            cancelledBy={cancellationInfoSource}
            isDriver={false}
          />
          <div
            ref={panelRef}
            className={`fixed inset-0 bg-white z-50 transition-transform duration-500 ease-out ${
              isVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Show Driver Details Panel if ride is accepted */}
            {bookingState === "ACCEPTED" && captainDetails ? (
              <DriverDetailsPanel
                driver={{
                  ...captainDetails,
                  rideId: currentRideId, // Make sure to pass the rideId
                }}
                onCancel={handleUserCancel}
                onBack={handleBack}
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
                        <span className="font-medium">
                          {distance?.toFixed(1)} km
                        </span>
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
                                bookingState !== "SEARCHING" &&
                                setSelectedRide(type)
                              } // Allow selection only if not searching
                              className={`flex items-center justify-between border-b py-3 transition-all duration-300 ${
                                selectedRide === type
                                  ? "bg-gray-200 shadow-inner px-2 rounded"
                                  : "hover:bg-gray-100 px-2"
                              } ${
                                bookingState === "SEARCHING"
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
                              <h2 className="text-lg font-medium">
                                ₹{prices[type]}
                              </h2>
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
                      className={`w-full mt-auto mb-4 p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
                        selectedRide &&
                        (bookingState === "INITIAL" ||
                          bookingState === "FAILED")
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
                        `Book ${
                          selectedRide
                            ? pricingTiers[selectedRide]?.name
                            : "a ride"
                        }`}
                      {bookingState === "SEARCHING" && "Finding your driver..."}
                      {bookingState === "FOUND" && "Driver found!"}
                      {bookingState === "FAILED" &&
                        `Retry Booking ${
                          selectedRide ? pricingTiers[selectedRide]?.name : ""
                        }`}
                      {/* Button text handled by showing DriverDetailsPanel when ACCEPTED */}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ChooseRidePanel;

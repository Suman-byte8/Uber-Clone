import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
// Import the hooks for socket and user context
import { useSocket } from "../context/SocketContext";
import { useUserContext } from "../context/UserContext";

// Assuming pricingTiers structure is like:
// { car: { name: 'Comfort', maxPassengers: 4 }, auto: {...}, ... }

const ChooseRidePanel = ({
  onBack,
  isVisible,
  distance,
  prices,
  estimatedTime,
  pricingTiers,
  pickupLocation, // Expecting { lat, lng }
  dropoffLocation, // Expecting { lat, lng }
}) => {
  const contentRef = useRef(null);
  const panelRef = useRef(null);
  const [selectedRide, setSelectedRide] = useState(null); // e.g., 'car', 'auto'
  // Booking States: INITIAL, SEARCHING, ACCEPTED, FAILED
  const [bookingState, setBookingState] = useState('INITIAL');
  const [errorMessage, setErrorMessage] = useState('');
  const [captainDetails, setCaptainDetails] = useState(null); // Store accepted captain info
  const [currentRideId, setCurrentRideId] = useState(null); // Store the ID of the requested ride

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

    console.log("ChooseRidePanel: Setting up socket listeners.");

    const handleRideAccepted = (data) => {
      console.log("Ride Accepted:", data);
      // Check if this acceptance is for the ride we requested
      if (data.rideId === currentRideId) {
        setCaptainDetails(data.captainDetails);
        setBookingState('ACCEPTED');
        setErrorMessage(''); // Clear any previous errors
      }
    };

    const handleRideRejected = (data) => {
      console.log("Ride Rejected:", data);
      // Could be rejected by a specific captain, maybe we wait for another or timeout
      // For simplicity now, we'll treat it as failure for this request
      if (data.rideId === currentRideId) {
        setBookingState('FAILED');
        setErrorMessage('The captain could not accept the ride. Please try again.');
        setCurrentRideId(null); // Reset ride ID
      }
    };

    const handleNoCaptainsAvailable = (data) => {
        console.log("No Captains Available:", data);
        if (data.rideId === currentRideId) {
            setBookingState('FAILED');
            setErrorMessage('No captains available nearby. Please try again later.');
            setCurrentRideId(null); // Reset ride ID
        }
    };

    // Optional: Listen for location updates *after* ride is accepted
    const handleCaptainLocationUpdate = (data) => {
        // Only process if a ride is accepted and the update is for our captain
        if (bookingState === 'ACCEPTED' && captainDetails && data.captainId === captainDetails.id) {
            console.log("Captain Location Update:", data.location);
            // TODO: Update the map with the new captain location
            // This might involve calling a function passed down via props
            // or using a shared map context.
            // Example: onCaptainLocationUpdate(data.location);
        }
    };

    // Register listeners
    socket.on('rideAccepted', handleRideAccepted);
    socket.on('rideRejected', handleRideRejected); // Assuming server sends this
    socket.on('noCaptainsAvailable', handleNoCaptainsAvailable); // Assuming server sends this
    socket.on('captainLocationUpdate', handleCaptainLocationUpdate);

    // Cleanup listeners on component unmount or socket change
    return () => {
      console.log("ChooseRidePanel: Cleaning up socket listeners.");
      socket.off('rideAccepted', handleRideAccepted);
      socket.off('rideRejected', handleRideRejected);
      socket.off('noCaptainsAvailable', handleNoCaptainsAvailable);
      socket.off('captainLocationUpdate', handleCaptainLocationUpdate);
    };
    // Rerun this effect if the socket instance changes
  }, [socket, currentRideId, bookingState, captainDetails]); // Add dependencies that handlers rely on


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
  const handleBookRide = () => {
    // Basic validation
    if (!selectedRide || !userId || !socket || !pickupLocation || !dropoffLocation) {
      console.error("Cannot book ride: Missing information", {
        selectedRide, userId, socket: !!socket, pickupLocation, dropoffLocation
      });
      setErrorMessage("Could not request ride. Please try again.");
      return;
    }

    if (bookingState === 'INITIAL' || bookingState === 'FAILED') {
      setBookingState('SEARCHING');
      setErrorMessage(''); // Clear previous errors
      setCaptainDetails(null); // Clear previous captain details

      // Generate a temporary ride ID on the client (optional, server might generate the final one)
      // Or better, let the server generate and return it in an ack or separate event.
      // For now, we'll assume the server handles ride ID generation internally
      // and includes it in response events like 'rideAccepted'.

      const rideDetails = {
        userId: userId,
        pickupLocation: pickupLocation,
        destinationLocation: dropoffLocation,
        rideType: selectedRide,
        price: prices[selectedRide],
        estimatedTime: estimatedTime,
        // Add any other relevant details
      };

      console.log("Emitting 'requestRide':", rideDetails);

      // Emit the ride request to the server
      socket.emit('requestRide', rideDetails, (response) => {
          // Optional: Acknowledgement from server
          if (response?.status === 'received' && response?.rideId) {
              console.log('Ride request received by server, ride ID:', response.rideId);
              setCurrentRideId(response.rideId); // Store the ride ID confirmed by the server
          } else if (response?.status === 'error') {
              console.error('Server error processing ride request:', response.message);
              setBookingState('FAILED');
              setErrorMessage(response.message || 'Server error. Please try again.');
          }
      });

      // Note: We set state to SEARCHING immediately. The actual ride ID might come later via ack.
      // The listeners set up in useEffect will handle the actual acceptance/rejection.
    }
  };

  // --- Back Button Logic ---
  const handleBack = () => {
      if (bookingState === 'SEARCHING' || bookingState === 'ACCEPTED') {
          // TODO: Implement ride cancellation logic if needed
          // socket.emit('cancelRide', { rideId: currentRideId });
          console.log("Need to implement ride cancellation");
      }
      // Reset state when going back
      setBookingState('INITIAL');
      setErrorMessage('');
      setCaptainDetails(null);
      setSelectedRide(null);
      setCurrentRideId(null);
      onBack(); // Call the original onBack prop
  }

  return (
    <div ref={panelRef} className={`fixed inset-0 bg-white z-50 transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>

      {/* Show Driver Details Panel if ride is accepted */}
      {bookingState === 'ACCEPTED' && captainDetails ? (
        <DriverDetailsPanel
            driver={captainDetails}
            onCancel={() => { /* TODO: Implement Cancel Ride Logic */ console.log("Cancel Ride Clicked"); setBookingState('INITIAL'); setCaptainDetails(null); setCurrentRideId(null); }}
            onBack={handleBack} // Allow going back from driver details
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
              <span className="text-sm text-gray-500">Please wait a moment</span>
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
                  <span className="font-medium">{formatTime(estimatedTime)}</span>
                </div>
              </div>

              <div className="_rides w-full px-2 flex-grow overflow-y-auto">
                {["car", "auto", "motorcycle"].map((type) => (
                  prices[type] && pricingTiers[type] && ( // Ensure price and tier data exists
                    <div
                      key={type}
                      onClick={() => bookingState !== 'SEARCHING' && setSelectedRide(type)} // Allow selection only if not searching
                      className={`flex items-center justify-between border-b py-3 transition-all duration-300 ${
                        selectedRide === type ? 'bg-gray-200 shadow-inner px-2 rounded' : 'hover:bg-gray-100 px-2'
                      } ${bookingState === 'SEARCHING' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            type === "car"
                              ? "/uber-car.png" // Use relative paths from public folder
                              : type === "auto"
                              ? "/uber-auto.png"
                              : "/uber-moto.png"
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
                          <p className="text-xs text-gray-600">{getEstimatedArrivalTime()} arrival</p>
                        </div>
                      </div>
                      <h2 className="text-lg font-medium">₹{prices[type]}</h2>
                    </div>
                  )
                ))}
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                  <div className="my-2 p-2 text-center text-red-600 bg-red-100 rounded">
                      {errorMessage}
                  </div>
              )}

              <button
                className={`w-full mt-auto mb-4 p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
                  selectedRide && (bookingState === 'INITIAL' || bookingState === 'FAILED')
                    ? 'bg-black text-white hover:bg-gray-800'
                    : bookingState === 'SEARCHING'
                    ? 'bg-yellow-500 text-black cursor-wait' // Indicate searching
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed' // Disabled state
                }`}
                disabled={!selectedRide || bookingState === 'SEARCHING'}
                onClick={handleBookRide}
              >
                {bookingState === 'INITIAL' && `Book ${selectedRide ? pricingTiers[selectedRide]?.name : 'a ride'}`}
                {bookingState === 'SEARCHING' && 'Finding your driver...'}
                {bookingState === 'FAILED' && `Retry Booking ${selectedRide ? pricingTiers[selectedRide]?.name : ''}`}
                {/* Button text handled by showing DriverDetailsPanel when ACCEPTED */}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// --- Driver Details Panel (Modified) ---
// Keep this as a separate component or inline like this
const DriverDetailsPanel = ({ driver, onCancel, onBack }) => (
  <div className="p-4 h-full flex flex-col">
     <button
        onClick={onBack} // Use the passed onBack handler
        className="flex items-center text-gray-600 mb-4 hover:text-gray-800 self-start"
      >
        <i className="ri-arrow-left-line text-2xl mr-2"></i>
        Back
      </button>

    <h2 className="text-2xl font-bold mb-4 text-center">Driver is on the way!</h2>

    <div className="flex items-center gap-4 border-b pb-4 mb-4">
      <img src={driver.photo || '/default-pfp.png'} alt={driver.name} className="w-16 h-16 rounded-full object-cover bg-gray-200" />
      <div>
        <h3 className="text-xl font-semibold">{driver.name}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <i className="ri-star-fill text-yellow-400"></i>
          <span>{driver.rating?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
    </div>

    {driver.vehicle && (
        <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Vehicle Details</h4>
        <div className="bg-gray-100 p-3 rounded-lg space-y-1 text-gray-800">
            <p><span className="font-semibold">{driver.vehicle.model}</span> ({driver.vehicle.color})</p>
            <p className="text-lg font-bold tracking-wider">{driver.vehicle.number}</p>
        </div>
        </div>
    )}

    {/* TODO: Add map view here showing driver location */}
    <div className="flex-grow flex items-center justify-center text-gray-400 bg-gray-50 rounded my-4">
        Map Placeholder
    </div>


    <div className="flex gap-3 mt-auto mb-2">
      <button className="flex-1 p-3 bg-gray-100 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200">
        <i className="ri-phone-line"></i> Call
      </button>
      <button className="flex-1 p-3 bg-gray-100 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200">
        <i className="ri-message-2-line"></i> Message
      </button>
    </div>

    <button
        onClick={onCancel}
        className="w-full p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium"
    >
      Cancel Ride
    </button>
  </div>
);


export default ChooseRidePanel;

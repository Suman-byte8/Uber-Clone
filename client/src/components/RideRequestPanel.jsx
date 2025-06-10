import React, { useState, useEffect, useRef } from "react";
import CancellationModal from "./Modals/CancellationModal";

const RideRequestPanel = ({ ride, onAccept, onReject, socket, captainId }) => {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancelledBy, setCancelledBy] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(0); // 0 = middle, -1 = reject, 1 = accept
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const actionTriggeredRef = useRef(false); // Track if action was already triggered

  useEffect(() => {
    if (!socket) return;

    // Listen for ride cancellation events
    const handleRideCancelled = (data) => {
      console.log(
        "DRIVER_VIEW (RideRequestPanel): Received 'rideCancelled' event. Data:",
        JSON.stringify(data),
        "Panel's Ride ID:",
        ride.rideId
      );
      if (data.rideId === ride.rideId) {
        console.log("DRIVER_VIEW (RideRequestPanel): rideId matches panel's rideId.");
        if (data.cancelledBy === "rider") {
          console.log("Ride cancelled by rider (driver's ride request panel view)");
        }
        setCancelledBy(data.cancelledBy);
        setShowCancellationModal(true);
        if (onReject) {
          onReject();
        }
      }
    };

    // Listen for acceptance confirmation
    const handleRideAcceptanceConfirmed = (data) => {
      console.log("DRIVER_VIEW: Ride acceptance confirmed by server:", data);
    };

    socket.on("rideCancelled", handleRideCancelled);
    socket.on("rideAcceptanceConfirmed", handleRideAcceptanceConfirmed);

    return () => {
      socket.off("rideCancelled", handleRideCancelled);
      socket.off("rideAcceptanceConfirmed", handleRideAcceptanceConfirmed);
    };
  }, [socket, ride.rideId, onReject]);

  const handleCancelRide = () => {
    console.log("DRIVER_VIEW: Driver cancelling ride:", ride.rideId);
    
    socket.emit("cancelRide", {
      rideId: ride.rideId,
      captainId,
      userId: ride.userId,
      cancelledBy: "driver",
      cancelTime: new Date().toISOString(),
      reason: "Driver cancelled the ride"
    });

    console.log("DRIVER_VIEW: Cancel ride event emitted for ride:", ride.rideId);
    
    setCancelledBy("driver");
    setShowCancellationModal(true);
    
    if (onReject) {
      onReject();
    }
  };

  const handleCloseModal = () => {
    setShowCancellationModal(false);
    if (onReject) onReject();
  };

  const handleAccept = () => {
    if (actionTriggeredRef.current) return; // Prevent multiple triggers
    actionTriggeredRef.current = true;
    
    console.log("🚗 DRIVER_VIEW: Driver ACCEPTED ride");
    console.log("🚗 DRIVER_VIEW: Ride details:", {
      rideId: ride.rideId,
      captainId: captainId,
      userId: ride.userId,
      pickup: ride.pickupLocation?.address,
      dropoff: ride.dropoffLocation?.address
    });

    // Emit ride acceptance event
    const acceptanceData = {
      rideId: ride.rideId,
      captainId: captainId,
      userId: ride.userId,
      acceptedAt: new Date().toISOString(),
      captainDetails: {
        id: captainId,
      }
    };

    console.log("🚗 DRIVER_VIEW: Emitting 'acceptRide' event with data:", acceptanceData);
    
    socket.emit("acceptRide", acceptanceData);
    
    console.log("🚗 DRIVER_VIEW: 'acceptRide' event emitted successfully");
    
    if (onAccept) {
      console.log("🚗 DRIVER_VIEW: Calling onAccept callback");
      onAccept();
    }
  };

  const handleReject = () => {
    if (actionTriggeredRef.current) return; // Prevent multiple triggers
    actionTriggeredRef.current = true;
    
    console.log("🚗 DRIVER_VIEW: Driver REJECTED ride");
    console.log("🚗 DRIVER_VIEW: Rejecting ride:", ride.rideId);

    const rejectionData = {
      rideId: ride.rideId,
      captainId: captainId,
      userId: ride.userId,
      rejectedAt: new Date().toISOString(),
      reason: "Driver rejected the ride"
    };

    console.log("🚗 DRIVER_VIEW: Emitting 'rejectRide' event with data:", rejectionData);
    
    socket.emit("rejectRide", rejectionData);
    
    console.log("🚗 DRIVER_VIEW: 'rejectRide' event emitted successfully");
    
    if (onReject) {
      console.log("🚗 DRIVER_VIEW: Calling onReject callback");
      onReject();
    }
  };

  // Slider functionality
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    actionTriggeredRef.current = false; // Reset action trigger flag
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    actionTriggeredRef.current = false; // Reset action trigger flag
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const halfWidth = containerWidth / 2;
    
    // Calculate position relative to center (0)
    const centerX = containerRect.left + halfWidth;
    const relativeX = e.clientX - centerX;
    
    // Normalize to -1 to 1 range
    const normalizedPosition = Math.max(-1, Math.min(1, relativeX / halfWidth));
    
    setSliderPosition(normalizedPosition);
    
    // Check if we've reached either end
    checkAndTriggerAction(normalizedPosition);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const halfWidth = containerWidth / 2;
    
    // Calculate position relative to center (0)
    const centerX = containerRect.left + halfWidth;
    const relativeX = touch.clientX - centerX;
    
    // Normalize to -1 to 1 range
    const normalizedPosition = Math.max(-1, Math.min(1, relativeX / halfWidth));
    
    setSliderPosition(normalizedPosition);
    
    // Check if we've reached either end
    checkAndTriggerAction(normalizedPosition);
  };

  const checkAndTriggerAction = (position) => {
    // Only trigger if we haven't already triggered an action
    if (actionTriggeredRef.current) return;
    
    if (position > 0.9) {
      // Accept ride
      handleAccept();
    } else if (position < -0.9) {
      // Reject ride
      handleReject();
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If no action was triggered, reset position
    if (!actionTriggeredRef.current) {
      setSliderPosition(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If no action was triggered, reset position
    if (!actionTriggeredRef.current) {
      setSliderPosition(0);
    }
  };

  useEffect(() => {
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      // Clean up
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Debug logging
  useEffect(() => {
    console.log(`Slider position: ${sliderPosition.toFixed(2)}`);
  }, [sliderPosition]);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-center">New Ride Request</h2>

      {/* Ride Details */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-map-pin-line text-green-500"></i>
          <p className="text-gray-800">{ride.pickupLocation.address}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-flag-line text-red-500"></i>
          <p className="text-gray-800">{ride.dropoffLocation.address}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="ri-route-line"></i>
          <p>Distance: {ride.distance.toFixed(1)} km</p>
        </div>
      </div>

      {/* Fare Information */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">Fare Information</h3>
        <p className="text-2xl font-bold">₹{ride.price.toFixed(2)}</p>
      </div>

      {/* Slider Action Control */}
      <div className="mt-auto">
        <div 
          ref={containerRef}
          className="relative h-16 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #f87171, #e5e7eb 40%, #e5e7eb 60%, #4ade80)'
          }}
        >
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
            <span className="text-red-700 font-medium">Reject</span>
            <span className="text-green-700 font-medium">Accept</span>
          </div>
          
          {/* Slider Thumb */}
          <div 
            ref={sliderRef}
            className="absolute top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-100"
            style={{ 
              left: `calc(50% + ${sliderPosition * 40}% - 28px)`,
              backgroundColor: sliderPosition < -0.4 ? '#fee2e2' : sliderPosition > 0.4 ? '#dcfce7' : 'white'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <i className={`text-xl ${
              sliderPosition < -0.4 ? 'ri-close-line text-red-500' : 
              sliderPosition > 0.4 ? 'ri-check-line text-green-500' : 
              'ri-drag-move-line text-gray-400'
            }`}></i>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-500">
          Slide {sliderPosition > 0.4 ? 'right to accept' : sliderPosition < -0.4 ? 'left to reject' : 'to accept or reject'} the ride
        </p>
      </div>

      {/* Alternative Action Buttons (as fallback) */}
      {/* <div className="mt-4 flex gap-3">
        <button
          onClick={handleReject}
          className="flex-1 p-3 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-red-100 hover:text-red-700 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 p-3 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-green-100 hover:text-green-700 transition-colors"
        >
          Accept
        </button>
      </div> */}

      {/* Cancel button (after accepting) */}
      {ride.status === "accepted" && (
        <button
          onClick={handleCancelRide}
          className="w-full mt-3 p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium"
        >
          Cancel Ride
        </button>
      )}

      <CancellationModal
        isOpen={showCancellationModal}
        onClose={handleCloseModal}
        cancelledBy={cancelledBy}
        isDriver={true}
      />
    </div>
  );
};

export default RideRequestPanel;
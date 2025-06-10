import React, { useState, useEffect } from "react";
import CancellationModal from "./Modals/CancellationModal";

const RideRequestPanel = ({ ride, onAccept, onReject, socket, captainId }) => {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancelledBy, setCancelledBy] = useState(null);

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
  }, [socket, ride.rideId]);

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
    console.log("🚗 DRIVER_VIEW: Driver clicked ACCEPT button");
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
    console.log("🚗 DRIVER_VIEW: Driver clicked REJECT button");
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

      {/* Action Buttons */}
      <div className="mt-auto flex gap-3">
        <button
          onClick={handleReject}
          className="flex-1 p-3 bg-gray-100 rounded-lg text-gray-700 font-medium"
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 p-3 bg-green-500 rounded-lg text-white font-medium"
        >
          Accept
        </button>
      </div>

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
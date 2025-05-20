import React, { useState, useEffect } from "react";
import CancellationModal from "./CancellationModal";

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
        // If the ride was cancelled by the other party, treat it as a rejection for this panel's state
        if (onReject) {
          onReject(); // Reset the panel or navigate back
        }
      }
    };

    socket.on("rideCancelled", handleRideCancelled);

    return () => {
      socket.off("rideCancelled", handleRideCancelled);
    };
  }, [socket, ride.rideId]);

  const handleCancelRide = () => {
    // Emit cancellation event
    socket.emit("cancelRide", {
      rideId: ride.rideId,
      captainId,
      userId: ride.userId, // Assuming ride object has userId
      cancelledBy: "driver",
      cancelTime: new Date().toISOString(),
    });

    // Show cancellation modal
    setCancelledBy("driver");
    setShowCancellationModal(true);
    // After driver cancels, treat it as a rejection for this panel's state
    if (onReject) {
      onReject(); // Reset the panel or navigate back
    }
  };

  const handleCloseModal = () => {
    setShowCancellationModal(false);
    // Navigate back or reset state
    if (onReject) onReject();
  };

  const handleAccept = () => {
    if (onAccept) onAccept();
  };

  const handleReject = () => {
    if (onReject) onReject();
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
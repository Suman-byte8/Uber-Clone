// Example implementation for a ride details component

import React, { useState, useEffect } from 'react';
import { cancelRide } from '../socket/emitters';

const RideDetails = ({ socket, rideData }) => {
  const [rideDetails, setRideDetails] = useState(null);
  const [captainDetails, setCaptainDetails] = useState(null);
  const [cancellationTimer, setCancellationTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [isCancelButtonEnabled, setIsCancelButtonEnabled] = useState(false);
  const [cancellationModalInfo, setCancellationModalInfo] = useState(null);
  const [cancelledBy, setCancelledBy] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for ride acceptance with details
    socket.on('rideAcceptedWithDetails', (data) => {
      // Set ride and captain details instead of showing cancellation modal
      setRideDetails(data);
      setCaptainDetails(data.captainDetails);
      startCancelCountdown(data.startCancellationTimer.expiresAt);
    });
    

    // Listen for ride cancellation
    socket.on('rideCancelledByUser', (data) => {
      showCancellationModal(data.cancelledBy);
      disableCancelButton();
    });

    // Listen for cancellation timeout
    socket.on('rideCancellationTimeout', () => {
      disableCancelButton();
    });

    socket.on('startCancellationTimer', (data) => {
      startCancelCountdown(data.expiresAt);
    });

    return () => {
      socket.off('rideAcceptedWithDetails');
      socket.off('rideCancelledByUser');
      socket.off('rideCancellationTimeout');
      socket.off('startCancellationTimer');
    };
  }, [socket]);

  const startCancelCountdown = (expiresAt) => {
    setIsCancelButtonEnabled(true);
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        disableCancelButton();
        socket.emit('rideCancellationTimeout', { rideId: rideData.id });
      }
    }, 1000);

    setCancellationTimer(timer);
  };

  const handleCancelRide = () => {
    if (!isCancelButtonEnabled) return;

    const cancelledBy = 'rider';
    socket.emit('cancelRide', {
      rideId: rideData.id,
      cancelledBy
    });
    showCancellationModal(cancelledBy);
  };

  const showCancellationModal = (cancelledBy) => {
    setCancellationModalInfo({
      cancelledBy,
      message: cancelledBy === 'captain' ? 'Driver cancelled the ride' : 'Rider cancelled the ride'
    });
    
    // Auto-close modal after 3 seconds
    setTimeout(() => setCancellationModalInfo(null), 3000);
  };

  const disableCancelButton = () => {
    setIsCancelButtonEnabled(false);
    if (cancellationTimer) {
      clearInterval(cancellationTimer);
    }
  };

  // Render captain details if available
  const renderCaptainDetails = () => {
    if (!captainDetails) return null;

    return (
      <div className="captain-details">
        <h3>Driver Details</h3>
        <p>Name: {captainDetails.name}</p>
        <p>Vehicle: {captainDetails.vehicle?.make} {captainDetails.vehicle?.model}</p>
        <p>Rating: {captainDetails.rating}</p>
        <p>Phone: {captainDetails.phoneNumber}</p>
      </div>
    );
  };

  return (
    <div>
      {/* Captain Details Section */}
      {renderCaptainDetails()}

      {/* Cancellation Button */}
      {isCancelButtonEnabled && (
        <div>
          <button 
            onClick={handleCancelRide}
            disabled={!isCancelButtonEnabled}
          >
            Cancel Ride (Time Left: {timeRemaining}s)
          </button>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellationModalInfo && (
        <div className="cancellation-modal">
          {cancellationModalInfo.message}
        </div>
      )}
    </div>
  );
};

export default RideDetails;
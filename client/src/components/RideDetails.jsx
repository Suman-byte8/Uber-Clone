import React from 'react';

const RideDetails = ({
  isRidePanelExpanded,
  setIsRidePanelExpanded,
  currentRide,
  handleCancelRide,
  cancelAllowed,
  timeLeft,
  socket // Add socket prop
}) => {
  // Add cancel handler
  const handleCancelClick = () => {
    if (!cancelAllowed || !socket || !currentRide) return;

    // Emit cancellation event to server
    socket.emit('rideCancelled', {
      rideId: currentRide.rideId,
      cancelledBy: 'driver',
      reason: 'Driver cancelled the ride'
    });

    // Call the parent's cancel handler
    handleCancelRide();
  };

  if (!currentRide || !currentRide.pickupLocation || !currentRide.dropoffLocation) {
    return (
      <div className="fixed left-4 bottom-20 z-30">
        <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
          <i className="ri-taxi-line" />
          <span>No active ride</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dropdown Header */}
      {!isRidePanelExpanded && (
        <div 
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
      )}

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
            onClick={handleCancelClick}
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
  );
};

export default RideDetails;
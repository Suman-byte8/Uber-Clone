import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RideDetails = ({
  isRidePanelExpanded,
  setIsRidePanelExpanded,
  currentRide,
  handleCancelRide,
  cancelAllowed,
  timeLeft,
  socket // Add socket prop
}) => {
  const [riderDetails, setRiderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fetch rider details when currentRide changes
  useEffect(() => {
    const fetchRiderDetails = async () => {
      if (!currentRide || !currentRide.userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL || 'http://localhost:8000'}/api/captain/rider/${currentRide.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          setRiderDetails(response.data.rider);
        } else {
          setError('Failed to load rider details');
        }
      } catch (err) {
        console.error('Error fetching rider details:', err);
        setError('Error loading rider information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRiderDetails();
  }, [currentRide]);

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

          {/* Rider Details Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Rider Information</h3>
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : riderDetails ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {riderDetails.photo ? (
                    <img 
                      src={riderDetails.photo} 
                      alt={riderDetails.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <i className="ri-user-fill text-3xl text-gray-400"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize">{riderDetails.name}</p>
                  {riderDetails.phone && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <i className="ri-phone-line"></i>
                      <a href={`tel:${riderDetails.phone}`} className="hover:text-blue-600">
                        {riderDetails.phone}
                      </a>
                    </div>
                  )}
                  {riderDetails.rating && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-star-fill text-yellow-400"></i>
                      <span>{riderDetails.rating.toFixed(1)} Rating</span>
                    </div>
                  )}
                </div>
              </div>
            ) : currentRide.rider ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {currentRide.rider.photo ? (
                    <img 
                      src={currentRide.rider.photo} 
                      alt={currentRide.rider.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <i className="ri-user-fill text-3xl text-gray-400"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{currentRide.rider.name}</p>
                  {currentRide.rider.phone && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <i className="ri-phone-line"></i>
                      <a href={`tel:${currentRide.rider.phone}`} className="hover:text-blue-600">
                        {currentRide.rider.phone}
                      </a>
                    </div>
                  )}
                  {currentRide.rider.rating && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-star-fill text-yellow-400"></i>
                      <span>{currentRide.rider.rating.toFixed(1)} Rating</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Rider information not available</p>
            )}
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
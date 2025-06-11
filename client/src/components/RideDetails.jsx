import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RideDetails = ({
  isRidePanelExpanded,
  setIsRidePanelExpanded,
  currentRide,
  handleCancelRide,
  cancelAllowed,
  timeLeft,
  socket // Socket prop
}) => {
  const [riderDetails, setRiderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // OTP and ride status states
  const [otpInput, setOtpInput] = useState('');
  const [rideStatus, setRideStatus] = useState('en_route'); // en_route, arrived, otp_verified, in_progress, completed
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

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

  // Handle OTP input change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpInput(value);
    setVerificationError(null);
  };

  // Handle OTP verification
  const handleVerifyOtp = () => {
    if (otpInput.length === 6 && socket && currentRide) {
      socket.emit('verifyOtp', {
        rideId: currentRide.rideId,
        otp: otpInput
      });
    } else {
      setVerificationError('Please enter a valid 6-digit OTP');
    }
  };

  // Handle start ride
  const handleStartRide = () => {
    if (socket && currentRide) {
      socket.emit('startRide', {
        rideId: currentRide.rideId
      });
    }
  };

  // Handle complete ride
  const handleCompleteRide = () => {
    if (socket && currentRide) {
      socket.emit('completeRide', {
        rideId: currentRide.rideId
      });
    }
  };

  // Notify server when driver arrives at pickup
  const notifyDriverArrived = () => {
    if (socket && currentRide) {
      setRideStatus('arrived');
      socket.emit('driverNearPickup', {
        rideId: currentRide.rideId,
        userId: currentRide.userId
      });
    }
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket || !currentRide) return;

    // Listen for OTP verification result
    const handleOtpVerificationResult = (data) => {
      console.log("OTP verification result:", data);
      if (data.rideId === currentRide.rideId) {
        if (data.success) {
          setRideStatus('otp_verified');
          setVerificationError(null);
          setVerificationSuccess(true);
        } else {
          setVerificationError(
            data.reason === 'expired' ? 'OTP has expired' : 'Invalid OTP'
          );
        }
      }
    };

    // Listen for OTP verified
    const handleOtpVerified = (data) => {
      console.log("OTP verified event:", data);
      if (data.rideId === currentRide.rideId) {
        setRideStatus('otp_verified');
        setVerificationSuccess(true);
      }
    };

    // Listen for ride started
    const handleRideStarted = (data) => {
      console.log("Ride started event:", data);
      if (data.rideId === currentRide.rideId) {
        setRideStatus('in_progress');
      }
    };

    // Listen for ride completed
    const handleRideCompleted = (data) => {
      console.log("Ride completed event:", data);
      if (data.rideId === currentRide.rideId) {
        setRideStatus('completed');
      }
    };

    socket.on('otpVerificationResult', handleOtpVerificationResult);
    socket.on('otpVerified', handleOtpVerified);
    socket.on('rideStarted', handleRideStarted);
    socket.on('rideCompleted', handleRideCompleted);

    return () => {
      socket.off('otpVerificationResult', handleOtpVerificationResult);
      socket.off('otpVerified', handleOtpVerified);
      socket.off('rideStarted', handleRideStarted);
      socket.off('rideCompleted', handleRideCompleted);
    };
  }, [socket, currentRide]);

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
        className={`fixed left-0 right-0 bg-white shadow-lg transform transition-all duration-300 ease-in-out z-20 overflow-scroll ${
          isRidePanelExpanded 
            ? 'translate-y-0 border-t border-gray-200' 
            : 'translate-y-full'
        }`}
        style={{ bottom: '5rem', maxHeight: '80vh' }}
      >
        {/* Panel Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-800">Ride Details</h3>
          <button
            onClick={() => setIsRidePanelExpanded(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 space-y-4 pb-20">
          {/* Ride Status Indicator */}
          <div className="bg-gray-50 p-3 rounded-lg flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              rideStatus === 'en_route' ? 'bg-yellow-500' :
              rideStatus === 'arrived' ? 'bg-blue-500' :
              rideStatus === 'otp_verified' ? 'bg-purple-500' :
              rideStatus === 'in_progress' ? 'bg-green-500' :
              'bg-gray-500'
            }`}></div>
            <span className="text-sm font-medium">
              {rideStatus === 'en_route' ? 'En route to pickup' :
               rideStatus === 'arrived' ? 'Arrived at pickup' :
               rideStatus === 'otp_verified' ? 'OTP verified' :
               rideStatus === 'in_progress' ? 'Ride in progress' :
               'Ride completed'}
            </span>
          </div>

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

          {/* OTP Input */}
          <div className="bg-gray-50 p-3 rounded-lg flex items-center">
            <input
              type="text"
              value={otpInput}
              onChange={handleOtpChange}
              placeholder="Enter OTP"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {verificationError && (
              <p className="text-red-500 text-sm mt-1">{verificationError}</p>
            )}
          </div>

          {/* Verify OTP Button */}
          <button
            onClick={handleVerifyOtp}
            className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Verify OTP
          </button>

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
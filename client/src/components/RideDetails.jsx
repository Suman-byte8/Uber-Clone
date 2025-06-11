import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
  const [receivedOtp, setReceivedOtp] = useState(null); // Store received OTP for debugging
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  
  // ADD: OTP verification state
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Generate a test OTP if needed
  const generateTestOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

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

  // // Handle OTP input change
  // const handleOtpChange = (e) => {
  //   const value = e.target.value.replace(/\D/g, '').slice(0, 6);
  //   setOtpInput(value);
  //   setVerificationError(null);
  // };

  // Verify OTP handler
  const handleVerifyOtp = () => {
    if (!otpInput || !currentRide?.rideId) return;

    console.log("🔑 Verifying OTP:", otpInput);
    
    socket.emit('verifyOtp', {
      rideId: currentRide.rideId,
      otp: otpInput
    });

    setOtpInput('');
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket || !currentRide?.rideId) return;

    console.log("🔑 Setting up OTP verification listeners");

    const handleOtpGenerated = (data) => {
      console.log("🔑 OTP received:", data);
      if (data.rideId === currentRide.rideId) {
        setReceivedOtp(data.otp);
      }
    };

    const handleOtpVerificationResult = (data) => {
      console.log("🔑 OTP verification result:", data);
      if (data.rideId === currentRide.rideId) {
        if (data.success) {
          setVerificationSuccess(true);
          setVerificationError(null);
          setRideStatus('otp_verified');
          // UPDATE: Set OTP verification state to true
          setIsOtpVerified(true);
          console.log("✅ OTP verified - state updated");
        } else {
          setVerificationError(data.reason === 'expired' ? 'OTP has expired' : 'Invalid OTP');
          // ENSURE: OTP verification state remains false on failure
          setIsOtpVerified(false);
        }
      }
    };

    // ADD: Listen for otpVerified event as well
    const handleOtpVerified = (data) => {
      console.log("🔑 OTP verified event received:", data);
      if (data.rideId === currentRide.rideId) {
        setIsOtpVerified(true);
        setVerificationSuccess(true);
        setRideStatus('otp_verified');
        console.log("✅ OTP verified via otpVerified event");
      }
    };

    socket.on('rideOtpGenerated', handleOtpGenerated);
    socket.on('otpVerificationResult', handleOtpVerificationResult);
    socket.on('otpVerified', handleOtpVerified); // ADD: Listen for otpVerified event

    return () => {
      socket.off('rideOtpGenerated', handleOtpGenerated);
      socket.off('otpVerificationResult', handleOtpVerificationResult);
      socket.off('otpVerified', handleOtpVerified); // ADD: Clean up otpVerified listener
    };
  }, [socket, currentRide?.rideId]);

  // Generate a test OTP if none is received after a timeout
  useEffect(() => {
    if (!receivedOtp && currentRide) {
      const timer = setTimeout(() => {
        if (!receivedOtp) {
          const testOtp = generateTestOtp();
          console.log("🔑 No OTP received from server, generating test OTP:", testOtp);
          setReceivedOtp(testOtp);
        }
      }, 5000); // Wait 5 seconds for server OTP before generating a test one
      
      return () => clearTimeout(timer);
    }
  }, [receivedOtp, currentRide]);

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
            {/* ADD: Show verification status in header */}
            {isOtpVerified && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Ride Details</h3>
            {/* ADD: Show verification status in panel header */}
            {isOtpVerified && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <i className="ri-check-line"></i>
                <span>Verified</span>
              </div>
            )}
          </div>
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
               rideStatus === 'otp_verified' ? 'Ride in progress' :
              //  rideStatus === 'in_progress' ? 'Ride in progress' :
               'Ride completed'}
            </span>
            {/* ADD: Show verification checkmark */}
            {isOtpVerified && (
              <i className="ri-check-line text-green-600 ml-2"></i>
            )}
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

          {/* OTP Verification Section */}
          {
            !isOtpVerified?
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Enter Rider's OTP</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpInput(value);
                  setVerificationError(null);
                }}
               
                className={`flex-1 px-4 py-2 border rounded-lg ${
                  verificationError ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={6}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={otpInput.length !== 6}
                className={`px-4 py-2 rounded-lg font-medium ${
                  otpInput.length === 6
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Verify
              </button>
            </div>
            {verificationError && (
              <p className="text-red-500 text-sm mt-2">{verificationError}</p>
            )}
            {verificationSuccess && (
              <p className="text-green-500 text-sm mt-2">OTP verified successfully!</p>
            )}
          </div>:
          <div className="mt-4 p-4 bg-green-50 rounded-lg flex flex-col items-center">
          <DotLottieReact
          src="https://lottie.host/5632cb93-0648-45e8-b4f9-89fdb71edc62/6XYPvOEhsW.lottie"
          loop
          autoplay
          />
          <span className="text-md font-semibold text-center">OTP Verified</span>
          </div>
          }
          

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
import { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import LivePosition from "../../components/LivePosition";

const DriverDetailsPanel = ({
  driver,
  onCancel,
  onBack,
  cancelAllowed = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [cancellationExpired, setCancellationExpired] = useState(false);
  const [showTracking, setShowTracking] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [otp, setOtp] = useState(null);
  const [rideStatus, setRideStatus] = useState('waiting');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [showTestOtp, setShowTestOtp] = useState(false);
  const socket = useSocket();

  // Generate a random 6-digit OTP for testing
  const generateTestOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Initialize driver location from props
  useEffect(() => {
    if (driver) {
      if (driver.location) {
        console.log("Setting driver location from driver.location:", driver.location);
        setDriverLocation({
          lat: driver.location.lat,
          lon: driver.location.lon || driver.location.lng
        });
      } 
      else if (driver.lat && (driver.lon || driver.lng)) {
        console.log("Setting driver location from driver direct properties");
        setDriverLocation({
          lat: driver.lat,
          lon: driver.lon || driver.lng
        });
      }
      else {
        console.log("No driver location found in props, will wait for updates");
      }
    }
  }, [driver]);

  // Get rider's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        console.log("Setting rider location:", location);
        setRiderLocation(location);
        
        if (!driverLocation) {
          console.log("Setting default driver location near rider");
          const defaultDriverLocation = {
            lat: location.lat + 0.01,
            lon: location.lon + 0.01
          };
          setDriverLocation(defaultDriverLocation);
        }
      });
    }
  }, []);

  // Listen for driver location updates
  useEffect(() => {
    if (!socket || !driver.rideId) {
      console.log("Missing socket or rideId:", {
        socket: !!socket,
        rideId: driver.rideId,
      });
      return;
    }

    console.log("Setting up location listener for driver:", driver.id);

    const handleDriverLocationUpdate = (data) => {
      console.log("Location update received:", data);
      if (data.captainId === driver.id) {
        console.log("Updating driver location:", data.location);
        const updatedLocation = {
          lat: data.location.lat,
          lon: data.location.lon || data.location.lng,
        };
        console.log("Normalized driver location:", updatedLocation);
        setDriverLocation(updatedLocation);
      }
    };

    socket.on("captainLocationUpdate", handleDriverLocationUpdate);
    socket.on("locationUpdate", (data) => {
      console.log("General location update received:", data);
      if (data.role === "captain" || data.role === "driver") {
        const updatedLocation = {
          lat: data.location.lat,
          lon: data.location.lon || data.location.lng,
        };
        console.log("Setting driver location from general update:", updatedLocation);
        setDriverLocation(updatedLocation);
      }
    });

    return () => {
      socket.off("captainLocationUpdate", handleDriverLocationUpdate);
      socket.off("locationUpdate");
    };
  }, [socket, driver.id, driver.rideId]);

  // Listen for OTP and ride status events
  useEffect(() => {
    if (!socket || !driver.rideId) {
      console.log("Cannot set up OTP listeners - missing socket or rideId");
      return;
    }
    
    console.log("🔑 Setting up OTP and ride status listeners for ride:", driver.rideId);
    
    // Listen for OTP generation
    const handleOtpGenerated = (data) => {
      console.log("🔑 OTP received from server:", data);
      
      if (data.rideId === driver.rideId) {
        console.log("🔑 Setting OTP:", data.otp);
        setOtp(data.otp);
        setRideStatus('driver_arrived');
      } else {
        console.log("🔑 OTP event received but rideId doesn't match:", {
          receivedRideId: data.rideId,
          expectedRideId: driver.rideId
        });
      }
    };
    
    // Register all listeners
    socket.on('rideOtpGenerated', handleOtpGenerated);
    socket.on('otpGenerated', handleOtpGenerated);
    socket.on('rideOtp', handleOtpGenerated);
    
    // Request OTP if we're already at the pickup location
    console.log("🔑 Requesting OTP for ride:", driver.rideId);
    socket.emit('requestOtp', { rideId: driver.rideId });
    
    return () => {
      socket.off('rideOtpGenerated', handleOtpGenerated);
      socket.off('otpGenerated', handleOtpGenerated);
      socket.off('rideOtp', handleOtpGenerated);
    };
  }, [socket, driver.rideId]);

  useEffect(() => {
    // Only start the timer if cancellation is allowed
    if (!cancelAllowed) return;

    // Start the countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCancellationExpired(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Clean up the timer
    return () => clearInterval(timer);
  }, [cancelAllowed]);

  const handleCancelRide = () => {
    if (!cancelAllowed || cancellationExpired) return;

    // Emit the cancelRide event
    socket.emit("rideCancelled", {
      rideId: driver.rideId,
      cancelledBy: "rider",
    });

    console.log("Ride cancelled by rider");
    if (onCancel) onCancel();
  };

  // Function to manually generate a test OTP
  const handleGenerateTestOtp = () => {
    setIsRequestingOtp(true);
    
    // Try to request from server first
    if (socket && driver.rideId) {
      console.log("🔑 Manually requesting OTP for ride:", driver.rideId);
      
      socket.emit('requestOtp', { 
        rideId: driver.rideId,
        userId: driver.userId || 'unknown',
        captainId: driver.id
      });
      
      socket.emit('generateOtp', { 
        rideId: driver.rideId,
        userId: driver.userId || 'unknown',
        captainId: driver.id
      });
    }
    
    // Generate a test OTP after a short delay
    setTimeout(() => {
      const testOtp = generateTestOtp();
      console.log("🔑 Generated test OTP:", testOtp);
      setOtp(testOtp);
      setRideStatus('driver_arrived');
      setShowTestOtp(true);
      setIsRequestingOtp(false);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header - Keep fixed */}
      <div className="px-4 py-3 border-b">
        <button onClick={onBack} className="flex items-center text-black">
          <i className="ri-arrow-left-line text-2xl mr-2"></i>
          <span className="text-xl font-semibold">Back</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Driver Info */}
        <div className="p-4 flex items-start gap-4 flex-col w-full">
          <div className="w-full flex items-center justify-center mb-2">
            <span className="text-2xl font-bold">Ride in progress...</span>
          </div>
          <div className="flex items-center gap-4 w-full">
            <img
              src={driver.photo || "/default-pfp.png"}
              alt=""
              className="w-20 h-20 rounded-full object-cover bg-[#FFF7EC]"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{driver.name}</h2>
              <div className="flex items-center gap-2 text-gray-600">
                <span>UberX</span>
                <span>·</span>
                <div className="flex items-center">
                  <i className="ri-star-fill text-black mr-1"></i>
                  <span>{driver.rating?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
              <div className="mt-1 text-gray-600">
                {driver.vehicle?.make} {driver.vehicle?.model}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 py-2 bg-gray-50 rounded-lg flex items-center">
          <span className="text-center w-full font-bold text-3xl m-3">
            {driver.vehicle?.licensePlate}
          </span>
        </div>

        {/* Ride Status Indicator */}
        <div className="px-4 mt-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              rideStatus === 'waiting' ? 'bg-yellow-500' :
              rideStatus === 'driver_arrived' ? 'bg-blue-500' :
              rideStatus === 'otp_verified' ? 'bg-purple-500' :
              rideStatus === 'in_progress' ? 'bg-green-500' :
              'bg-gray-500'
            } mr-2`}></div>
            <span className="text-sm font-medium">
              {rideStatus === 'waiting' ? 'Driver is on the way' :
               rideStatus === 'driver_arrived' ? 'Driver has arrived' :
               rideStatus === 'otp_verified' ? 'OTP verified' :
               rideStatus === 'in_progress' ? 'Ride in progress' :
               'Ride completed'}
            </span>
          </div>
        </div>

        {/* OTP Display Section - Show when driver has arrived or test OTP is generated */}
        {((rideStatus === 'driver_arrived' || rideStatus === 'otp_verified' || showTestOtp) && otp) && (
          <div className="mt-4 mx-4 p-4 bg-yellow-50 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-center mb-2">Share this code with your driver</h3>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {otp.split('').map((digit, index) => (
                  <div key={index} className="w-10 h-12 flex items-center justify-center bg-white border-2 border-yellow-500 rounded-md text-2xl font-bold">
                    {digit}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-center mt-2 text-gray-600">
              Driver will enter this code to start your ride
            </p>
          </div>
        )}

        {/* Generate OTP Button - Show when no OTP is available */}
        {!otp && (
          <div className="mt-4 mx-4">
            <button
              onClick={handleGenerateTestOtp}
              disabled={isRequestingOtp}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center"
            >
              {isRequestingOtp ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating OTP...
                </>
              ) : (
                <>
                  <i className="ri-key-2-line mr-2"></i>
                  Generate Verification Code
                </>
              )}
            </button>
            <p className="text-xs text-center mt-1 text-gray-500">
              Click to generate a verification code for your driver
            </p>
          </div>
        )}

        {/* Contact Buttons */}
        <div className="px-4 flex flex-col gap-3">
          <button
            onClick={() => (window.location.href = `tel:${driver.phoneNumber}`)}
            className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full">
              <i className="ri-phone-line text-xl"></i>
            </div>
            <span className="font-medium">Call</span>
          </button>
          <button
            onClick={() => (window.location.href = `sms:${driver.phoneNumber}`)}
            className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full">
              <i className="ri-message-2-line text-xl"></i>
            </div>
            <span className="font-medium">Message</span>
          </button>
        </div>

        {/* ETA Info */}
        <div className="px-4 mt-4 flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
            <i className="ri-car-line text-xl"></i>
          </div>
          <div>
            <div className="font-medium">{driver.name} is arriving</div>
            <div className="text-gray-600">
              Arriving in {driver.estimatedArrival || "3"} minutes
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="h-[400px] w-full mt-4 relative overflow-hidden rounded-lg p-6 shadow-md">
          {riderLocation && (
            <LivePosition
              location={riderLocation}
              driverLocation={driverLocation}
              isDriver={false}
              isRideActive={true}
              showRoute={showTracking}
            />
          )}
          
          {/* Debug info overlay */}
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 p-2 rounded text-xs z-10">
            <div>Rider: {riderLocation ? `${riderLocation.lat.toFixed(4)}, ${riderLocation.lon.toFixed(4)}` : 'Loading...'}</div>
            <div>Driver: {driverLocation ? `${driverLocation.lat.toFixed(4)}, ${driverLocation.lon.toFixed(4)}` : 'Not available'}</div>
            <div>Tracking: {showTracking ? 'On' : 'Off'}</div>
           
          </div>
        </div>
      </div>

      {/* Bottom Buttons - Keep fixed */}
      <div className="p-4 grid grid-cols-2 gap-4 bg-white border-t">
        <button
          onClick={handleCancelRide}
          disabled={!cancelAllowed || cancellationExpired}
          className="py-3 px-2 bg-gray-100 rounded-full font-medium disabled:opacity-50"
        >
          {cancelAllowed && !cancellationExpired
            ? `Cancel Ride (${timeLeft}s)`
            : "Cancellation Expired"}
        </button>
        <button
          onClick={() => setShowTracking(!showTracking)}
          className={`py-3 px-2 rounded-full font-medium ${
            showTracking ? "bg-blue-500 text-white" : "bg-black text-white"
          }`}
        >
          {showTracking ? "Hide tracking" : "Track driver"}
        </button>
      </div>

      {/* Cancellation Timer */}
      {cancelAllowed && !cancellationExpired && (
        <div className="absolute top-4 right-4 bg-yellow-50 px-3 py-1 rounded-full text-yellow-700 text-sm">
          <i className="ri-time-line mr-1"></i>
          <span>{timeLeft}s</span>
        </div>
      )}
    </div>
  );
};

export default DriverDetailsPanel;

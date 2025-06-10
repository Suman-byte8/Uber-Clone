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
  const [showTracking, setShowTracking] = useState(false);
  const [driverLocation, setDriverLocation] = useState(
    driver?.location || null
  );
  const [riderLocation, setRiderLocation] = useState(null);
  const socket = useSocket();

  // Get rider's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setRiderLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
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
        setDriverLocation({
          lat: data.location.lat,
          lon: data.location.lon || data.location.lng,
        });
      }
    };

    // Initial driver location setup
    if (driver.location) {
      console.log("Setting initial driver location:", driver.location);
      setDriverLocation({
        lat: driver.location.lat,
        lon: driver.location.lon || driver.location.lng,
      });
    }

    socket.on("captainLocationUpdate", handleDriverLocationUpdate);

    return () => {
      socket.off("captainLocationUpdate", handleDriverLocationUpdate);
    };
  }, [socket, driver.id, driver.rideId, driver.location]);

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
      rideId: driver.rideId, // Assuming `rideId` is part of the `driver` object
      cancelledBy: "rider", // Specify who canceled the ride
    });

    console.log("Ride cancelled by rider");
    if (onCancel) onCancel(); // Call the onCancel prop if provided
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
          <span className=" text-center w-full font-bold text-3xl m-3">
            {driver.vehicle?.licensePlate}
          </span>
        </div>

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
          <LivePosition
            location={riderLocation}
            driverLocation={driverLocation}
            isDriver={false}
            isRideActive={true}
            showRoute={showTracking}
          />
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

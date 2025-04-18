import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import io from "socket.io-client";

const ChooseRidePanel = ({
  onBack,
  isVisible,
  distance,
  prices,
  estimatedTime,
  pricingTiers,
  pickupLocation,
  dropoffLocation
}) => {
  const contentRef = useRef(null);
  const panelRef = useRef(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingState, setBookingState] = useState('INITIAL'); // INITIAL, SEARCHING, DRIVER_FOUND
  const [driverDetails, setDriverDetails] = useState(null);
  const socket = io();

  const isLoading = !distance || !estimatedTime || !prices?.car;

  useEffect(() => {
    if (!contentRef.current || !panelRef.current) return;

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    if (isVisible) {
      gsap.set(panelRef.current, { yPercent: 100, opacity: 0 });
      gsap.set(contentRef.current, { y: 50, opacity: 0 });

      timeline
        .to(panelRef.current, {
          yPercent: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        })
        .to(
          contentRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.4"
        );
    } else {
      timeline
        .to(contentRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        })
        .to(
          panelRef.current,
          {
            yPercent: 100,
            opacity: 0,
            duration: 0.8,
            ease: "power3.in",
          },
          "-=0.3"
        );
    }
  }, [isVisible]);

  useEffect(() => {
    if (bookingState === 'SEARCHING') {
      // Connect to socket and emit ride request
      socket.emit('new_ride_request', {
        rideType: selectedRide,
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        price: prices[selectedRide],
        estimatedTime
      });

      // Listen for driver match
      socket.on('driver_found', (driver) => {
        setDriverDetails(driver);
        setBookingState('DRIVER_FOUND');
      });

      // Listen for driver location updates
      socket.on('driver_location', (location) => {
        // Update driver location on map
      });
    }

    return () => {
      socket.off('driver_found');
      socket.off('driver_location');
    };
  }, [bookingState]);

  const formatTime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEstimatedArrivalTime = () => {
    if (!estimatedTime) return "";
    const now = new Date();
    now.setMinutes(now.getMinutes() + estimatedTime);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleBookRide = () => {
    if (bookingState === 'INITIAL') {
      setBookingState('SEARCHING');
    }
  };

  return (
    <div ref={panelRef} className="fixed inset-0 bg-white z-50">
      <div ref={contentRef} className="p-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 mb-4 hover:text-gray-800"
        >
          <i className="ri-arrow-left-line text-2xl mr-2"></i>
          Back
        </button>

        {!isLoading ? (
          <>
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Est. Time:</span>
                <span className="font-medium">{formatTime(estimatedTime)}</span>
              </div>
            </div>

            <div className="_rides w-full px-2">
              {["car", "auto", "motorcycle"].map((type) => (
                <div
                  key={type}
                  onClick={() => setSelectedRide(type)}
                  className={`_${type} flex items-center justify-between border-b-2 py-2 cursor-pointer transition-all duration-300 ${
                    selectedRide === type ? 'bg-[#dddddd] shadow-md px-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <img
                      src={
                        type === "car"
                          ? "https://www.pngplay.com/wp-content/uploads/8/Uber-PNG-Photos.png"
                          : type === "auto"
                          ? "https://clipart-library.com/2023/Uber_Auto_312x208_pixels_Mobile.png"
                          : "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,w_956,h_637/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png"
                      }
                      alt=""
                      className="w-[8rem]"
                    />
                    <div>
                      <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                        {pricingTiers[type].name}
                        <i className="ri-user-fill text-sm font-normal"></i>
                        <span className="text-sm font-normal">
                          {pricingTiers[type].maxPassengers}
                        </span>
                      </h4>
                      <p className="text-sm">{getEstimatedArrivalTime()}</p>
                    </div>
                  </div>
                  <h2 className="text-xl font-medium">₹{prices[type]}</h2>
                </div>
              ))}
            </div>

            <button 
              className={`w-full my-4 p-3 rounded-lg text-xl font-medium ${
                selectedRide 
                  ? 'bg-black text-white hover:bg-gray-900' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!selectedRide || bookingState !== 'INITIAL'}
              onClick={handleBookRide}
            >
              {bookingState === 'INITIAL' && 'Book a ride'}
              {bookingState === 'SEARCHING' && 'Finding your driver...'}
              {bookingState === 'DRIVER_FOUND' && 'Driver is on the way'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <span className="text-xl font-medium text-gray-600 mb-2">
              Calculating route...
            </span>
            <span className="text-sm text-gray-500">Please wait a moment</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DriverDetailsPanel = ({ driver }) => (
  <div className="fixed inset-0 bg-white z-50 p-4">
    <div className="flex items-center gap-4 border-b pb-4">
      <img src={driver.photo} className="w-16 h-16 rounded-full" />
      <div>
        <h3 className="text-xl font-semibold">{driver.name}</h3>
        <div className="flex items-center gap-1">
          <i className="ri-star-fill text-yellow-400"></i>
          <span>{driver.rating}</span>
        </div>
      </div>
    </div>

    <div className="mt-4">
      <h4 className="font-medium">Vehicle Details</h4>
      <div className="mt-2 space-y-1 text-gray-600">
        <p>{driver.vehicle.model}</p>
        <p>{driver.vehicle.color}</p>
        <p className="font-medium">{driver.vehicle.number}</p>
      </div>
    </div>

    <div className="flex gap-3 mt-6">
      <button className="flex-1 p-3 bg-gray-100 rounded-lg">
        <i className="ri-phone-line"></i> Call
      </button>
      <button className="flex-1 p-3 bg-gray-100 rounded-lg">
        <i className="ri-message-2-line"></i> Message
      </button>
    </div>

    <button className="w-full mt-4 p-3 bg-red-100 text-red-600 rounded-lg">
      Cancel Ride
    </button>
  </div>
);

export default ChooseRidePanel;

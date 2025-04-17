import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

const ChooseRidePanel = ({ 
  onBack, 
  isVisible, 
  distance, 
  prices, 
  estimatedTime,
  pricingTiers
}) => {
  const contentRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || !panelRef.current) return;

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    if (isVisible) {
      // Reset initial state
      gsap.set(panelRef.current, {
        yPercent: 100,
        opacity: 0,
      });
      gsap.set(contentRef.current, {
        y: 50,
        opacity: 0,
      });

      // Animate panel sliding up
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
          "-=0.4" // Start content animation before panel finishes
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
          "-=0.3" // Start panel animation before content finishes
        );
    }
  }, [isVisible]);

  // Format time for display
  const formatTime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get current time plus estimated travel time
  const getEstimatedArrivalTime = () => {
    if (!estimatedTime) return "";
    const now = new Date();
    now.setMinutes(now.getMinutes() + estimatedTime);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

        {distance && (
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{distance.toFixed(1)} km</span>
            </div>
            {estimatedTime && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Est. Time:</span>
                <span className="font-medium">{formatTime(estimatedTime)}</span>
              </div>
            )}
          </div>
        )}

        <div className="_rides w-full px-2">
          {/* Car (Uber X) */}
          <div className="_cab flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://www.pngplay.com/wp-content/uploads/8/Uber-PNG-Photos.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  {pricingTiers.car.name}<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">{pricingTiers.car.maxPassengers}</span>
                </h4>
                <p className="text-sm">{getEstimatedArrivalTime()}</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹{prices.car || "---"}</h2>
          </div>
          
          {/* Auto */}
          <div className="_auto flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://clipart-library.com/2023/Uber_Auto_312x208_pixels_Mobile.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  {pricingTiers.auto.name}<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">{pricingTiers.auto.maxPassengers}</span>
                </h4>
                <p className="text-sm">{getEstimatedArrivalTime()}</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹{prices.auto || "---"}</h2>
          </div>
          
          {/* Motorcycle */}
          <div className="_moto flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,w_956,h_637/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  {pricingTiers.motorcycle.name}<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">{pricingTiers.motorcycle.maxPassengers}</span>
                </h4>
                <p className="text-sm">{getEstimatedArrivalTime()}</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹{prices.motorcycle || "---"}</h2>
          </div>
        </div>

        <button className="w-full my-4 bg-black mx-auto p-3 rounded-lg text-white text-xl font-medium">
          Book a ride
        </button>
      </div>
    </div>
  );
};

export default ChooseRidePanel;

import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

const ChooseRidePanel = ({ onBack, isVisible }) => {
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
          duration: 0.5,
          ease: "power3.out",
        })
        .to(
          contentRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.3" // Start content animation before panel finishes
        );
    } else {
      timeline
        .to(contentRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .to(
          panelRef.current,
          {
            yPercent: 100,
            opacity: 0,
            duration: 0.5,
            ease: "power3.in",
          },
          "-=0.2" // Start panel animation before content finishes
        );
    }
  }, [isVisible]);

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

        <h4 className="w-full text-sm text-center pb-4 border-b-2 border-gray-300">
          Choose a ride, or swipe up for more
        </h4>
        <div className="_rides w-full px-2">
          {/* uber cab  */}
          <div className="_cab flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://www.pngplay.com/wp-content/uploads/8/Uber-PNG-Photos.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  Uber X<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">4</span>
                </h4>
                <p className="text-sm">3.15pm</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹36.46</h2>
          </div>
          {/* uber auto  */}
          <div className="_auto flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://clipart-library.com/2023/Uber_Auto_312x208_pixels_Mobile.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  Auto<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">4</span>
                </h4>
                <p className="text-sm">3.15pm</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹34.20</h2>
          </div>
          {/* uber motorcycle  */}
          <div className="_moto flex items-center justify-between border-b-2 py-2">
            <div className="flex items-center justify-between">
              <img
                src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,w_956,h_637/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png"
                alt=""
                className="w-[8rem]"
              />
              <div className="">
                <h4 className="text-xl font-semibold w-full flex items-center gap-1">
                  Motorcycle<i className="ri-user-fill text-sm font-normal"></i>
                  <span className="text-sm font-normal">2</span>
                </h4>
                <p className="text-sm">3.20pm</p>
              </div>
            </div>
            <h2 className="text-xl font-medium">₹69.85</h2>
          </div>
        </div>

        <button className="w-full my-4 bg-black mx-auto p-3 rounded-lg text-white text-xl font-medium">
          Choose a ride
        </button>
      </div>
    </div>
  );
};

export default ChooseRidePanel;

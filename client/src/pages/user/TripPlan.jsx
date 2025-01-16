import React, { useRef } from "react";
import tempMap from "../../assets/temp_map.png";
import gsap from "gsap";


const TripPlan = () => {
const confirmDestinationPanelRef = useRef(null)
  
  return (
    <div className="relative h-screen w-full">
      {/* go back button */}
      <div className="_goBackBTN rounded-full bg-[#252525] w-12 h-12 absolute top-4 left-4 text-white flex items-center justify-center">
        <i class="ri-arrow-left-line text-3xl"></i>
      </div>

      <img src={tempMap} alt="" className="h-full w-full object-cover " />

      {/* confirm destination panel */}
      <div ref={confirmDestinationPanelRef} className="confirm_destination_panel w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl">
        <button onClick={() => {
          if (confirmDestinationPanelRef.current.style.height === '100%') {
            gsap.to(confirmDestinationPanelRef.current, {
              height: 'auto',
              duration: 0.5,
              ease: 'power1.out'
            });
          } else {
            gsap.to(confirmDestinationPanelRef.current, {
              height: '100%',
              duration: 0.5,
              ease: 'power1.out'
            });
          }
        }} className="w-full text-center text-white text-2xl">
          <i class={confirmDestinationPanelRef.current.style.height === '100%' ? "ri-arrow-down-wide-line" : "ri-arrow-up-wide-line"}></i>
        </button>

        <h1 className="text-white text-2xl font-medium text-center">
          Set your destination
        </h1>
        <h4 className="text-white text-center text-lg ">
          Drag the map to move the pin
        </h4>
        <hr className="my-2" />

        <div className="w-full p-4 flex flex-col gap-4">
          <div className="searchBar flex bg-[#343b41]  p-3 rounded-xl text-white text-xl">
            <input
              type="text"
              placeholder="Search for a destination"
              className="bg-transparent w-full outline-none border-0 "
            />
            <i class="ri-search-line"></i>
          </div>

          <button className="bg-gray-300  w-full  p-3  rounded-xl text-xl font-medium">
            Confirm destination
          </button>
        </div>
      </div>


    </div>
  );
};

export default TripPlan;

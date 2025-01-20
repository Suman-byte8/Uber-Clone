import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import axios from "axios";

import PickUpPanel from "../../components/PickUpPanel";
import LivePosition from "../../components/LivePosition";

const TripPlan = () => {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [panelState, setPanelState] = useState({
    isOpen: false,
    height: "auto",
    fullHeight: "100vh",
    paddingBottom: "3rem",
  });

  const [pickupState, setPickupState] = useState({
    query: "",
    suggestions: [],
    isLoading: false,
    error: null,
  });

  const [dropoffState, setDropoffState] = useState({
    query: "",
    suggestions: [],
    isLoading: false,
    error: null,
    isVisible: false,
  });

  // Enhanced panel animation effect with slower closing
  useEffect(() => {
    if (panelRef.current && contentRef.current) {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power2.inOut",
        },
      });

      if (panelState.isOpen) {
        // Opening animation
        timeline
          .to(panelRef.current, {
            height: panelState.fullHeight,
            duration: 0.3,
            ease: "power2.out",
          })
          .to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.2,
            delay: -0.1,
          });
      } else {
        // Closing animation - slower and smoother
        timeline
          .to(contentRef.current, {
            opacity: 0.8,
            y: 10,
            duration: 0.4,
            ease: "power2.inOut",
          })
          .to(panelRef.current, {
            height: panelState.height,
            duration: 0.6, // Increased duration for closing
            ease: "power4.inOut", // Smoother easing for closing
            paddingBottom: panelState.paddingBottom,
          });
      }

      setDropoffState((prev) => ({
        ...prev,
        isVisible: panelState.isOpen,
      }));
    }
  }, [panelState.isOpen]);

  // Rest of your code remains the same...
  const togglePanel = () => {
    setPanelState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const fetchSuggestions = async (value, setState) => {
    console.log("Fetching suggestions for:", value);

    setState((prev) => ({
      ...prev,
      query: value,
      isLoading: true,
    }));

    if (value.length < 3) {
      setState((prev) => ({
        ...prev,
        suggestions: [],
        isLoading: false,
      }));
      return;
    }

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/locations/suggestions?query=${value}`
      );

      setState((prev) => ({
        ...prev,
        suggestions: response.data,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setState((prev) => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: "Failed to fetch suggestions",
      }));
    }
  };

  const handlePickupSearch = (value) => fetchSuggestions(value, setPickupState);
  const handleDropoffSearch = (value) =>
    fetchSuggestions(value, setDropoffState);

  const debouncedDropoffSearch = debounce(handleDropoffSearch, 300);
  const debouncedPickupSearch = debounce(handlePickupSearch, 300);

  const handleSuggestionSelect = (suggestion, setState, containerClass) => {
    gsap.to(containerClass, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        if (typeof setState === "function") {
          setState((prev) => ({
            ...prev,
            query: suggestion.display_name,
            suggestions: [],
          }));
        } else {
          console.error("setState is not a function", setState);
        }
      },
    });
  };

  const handleInputFocus = () => {
    if (!panelState.isOpen) {
      setPanelState((prev) => ({
        ...prev,
        isOpen: true,
      }));
    }
  };

  return (
    <div className="relative h-screen w-full">
      <button
        onClick={() => window.history.back()}
        className="rounded-full bg-[#252525] w-12 h-12 absolute top-4 left-4 text-white flex items-center justify-center z-10 hover:scale-105 transition-transform duration-300"
      >
        <i className="ri-arrow-left-line text-3xl"></i>
      </button>

      {/* <img src={tempMap} alt="Map" className="h-full w-full object-cover" /> // temporary map image */}

      <div className="h-full w-full -z-10">
        <LivePosition />
      </div>

      <div
        ref={panelRef}
        className={`w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl transition-all duration-700 z-10 ${
          panelState.isOpen ? "h-full" : "pb-12"
        }`}
      >
        <button
          onClick={togglePanel}
          className="w-full h-10 flex items-center justify-center text-white transition-transform duration-200"
        >
          <i
            className={`ri-arrow-${
              panelState.isOpen ? "down" : "up"
            }-wide-line text-2xl transform transition-transform duration-300 ${
              panelState.isOpen ? "rotate-180" : ""
            }`}
          ></i>
        </button>

        <PickUpPanel
          contentRef={contentRef}
          panelState={panelState}
          pickupState={pickupState}
          dropoffState={dropoffState}
          handlePickupSearch={debouncedPickupSearch}
          handleDropoffSearch={debouncedDropoffSearch}
          handleInputFocus={handleInputFocus}
          handleSuggestionSelect={handleSuggestionSelect}
          setPickupState={setPickupState}
          setDropoffState={setDropoffState}
        />
      </div>
    </div>
  );
};

export default TripPlan;



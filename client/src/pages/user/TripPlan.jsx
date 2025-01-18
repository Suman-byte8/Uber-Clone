import React, { useRef, useState, useEffect } from "react";
import tempMap from "../../assets/temp_map.png";
import gsap from "gsap";
import axios from "axios";

const TripPlan = () => {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [panelState, setPanelState] = useState({
    isOpen: false,
    height: "50vh",
    fullHeight: "100vh"
  });
  
  // Separate states for pickup and dropoff
  const [pickupState, setPickupState] = useState({
    query: "",
    suggestions: [],
    isLoading: false,
    error: null
  });
  
  const [dropoffState, setDropoffState] = useState({
    query: "",
    suggestions: [],
    isLoading: false,
    error: null
  });

  // Panel animation effect
  useEffect(() => {
    if (panelRef.current && contentRef.current) {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power2.inOut",
          duration: 0.3
        }
      });

      if (panelState.isOpen) {
        timeline
          .to(panelRef.current, {
            height: panelState.fullHeight,
            duration: 0.1,
          })
          .to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.1,
            delay: -0.3
          });
      } else {
        timeline
          .to(contentRef.current, {
            y: 20,
            duration: 0.4
          })
          .to(panelRef.current, {
            height: panelState.height,
            duration: 0.1,
            ease: "power4.inOut",
          });
      }
    }
  }, [panelState.isOpen]);

  const togglePanel = () => {
    setPanelState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Generic function to fetch suggestions
  const fetchSuggestions = async (value, setState) => {
    setState(prev => ({
      ...prev,
      query: value,
      isLoading: true
    }));

    if (value.length < 3) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false
      }));
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/locations/suggestions?query=${value}`);
      setState(prev => ({
        ...prev,
        suggestions: response.data,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: "Failed to fetch suggestions"
      }));
    }
  };

  const handlePickupSearch = (value) => fetchSuggestions(value, setPickupState);
  const handleDropoffSearch = (value) => fetchSuggestions(value, setDropoffState);

  const debouncedPickupSearch = debounce(handlePickupSearch, 300);
  const debouncedDropoffSearch = debounce(handleDropoffSearch, 300);

  // Generic function to handle suggestion selection
  const handleSuggestionSelect = (suggestion, setState, containerClass) => {
    gsap.to(containerClass, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        setState(prev => ({
          ...prev,
          query: suggestion.display_name,
          suggestions: []
        }));
      }
    });
  };

  const handleInputFocus = () => {
    if (!panelState.isOpen) {
      setPanelState(prev => ({
        ...prev,
        isOpen: true
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

      <img src={tempMap} alt="Map" className="h-full w-full object-cover" />

      <div
        ref={panelRef}
        className="w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl transition-all duration-700 z-10"
      >
        <button
          onClick={togglePanel}
          className="w-full h-10 flex items-center justify-center text-white transition-transform duration-500"
        >
          <i 
            className={`ri-arrow-${panelState.isOpen ? 'down' : 'up'}-wide-line text-2xl transform transition-transform duration-500 ${
              panelState.isOpen ? 'rotate-180' : ''
            }`}
          ></i>
        </button>

        <div 
          ref={contentRef}
          className="text-white px-4 transition-all duration-500"
        >
          <h1 className="text-2xl font-medium text-center mb-2 transform transition-all duration-500">
            Set your destination
          </h1>
          <h4 className="text-lg text-center mb-4 transform transition-all duration-500">
            Enter pickup and dropoff locations
          </h4>
          <hr className="mb-4 opacity-50 transition-opacity duration-500" />

          <div className="flex flex-col gap-4">
            {/* Pickup Location */}
            <div className="relative transform transition-all duration-500">
              <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-300">
                <i className="ri-map-pin-line mr-2"></i>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  value={pickupState.query}
                  onChange={(e) => debouncedPickupSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  className="bg-transparent w-full outline-none border-0 transition-all duration-300"
                />
                {pickupState.isLoading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-search-line"></i>
                )}
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="relative transform transition-all duration-500">
              <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-300">
                <i className="ri-flag-line mr-2"></i>
                <input
                  type="text"
                  placeholder="Enter dropoff location"
                  value={dropoffState.query}
                  onChange={(e) => debouncedDropoffSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  className="bg-transparent w-full outline-none border-0 transition-all duration-300"
                />
                {dropoffState.isLoading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-search-line"></i>
                )}
              </div>
            </div>

            {/* Common Suggestions Section */}
            {(pickupState.suggestions.length > 0 || dropoffState.suggestions.length > 0) && (
              <div className="common-suggestions-container w-full mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 transform transition-all duration-500">
                {[...pickupState.suggestions, ...dropoffState.suggestions].map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (pickupState.suggestions.includes(suggestion)) {
                        handleSuggestionSelect(suggestion, setPickupState, '.common-suggestions-container');
                      } else {
                        handleSuggestionSelect(suggestion, setDropoffState, '.common-suggestions-container');
                      }
                    }}
                    className="p-3 text-white hover:bg-gray-700 cursor-pointer transition-all duration-300 flex gap-2 text-base"
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                  >
                    <i className="ri-map-pin-fill"></i>
                    {suggestion.display_name}
                  </div>
                ))}
              </div>
            )}

            <button 
              className="bg-gray-300 w-full p-3 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-400 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => {/* Add confirmation logic */}}
            >
              Confirm Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlan;
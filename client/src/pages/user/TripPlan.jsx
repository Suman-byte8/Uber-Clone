import React, { useRef, useState, useEffect } from "react";
import tempMap from "../../assets/temp_map.png";
import gsap from "gsap";
import axios from "axios";

const TripPlan = () => {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [panelState, setPanelState] = useState({
    isOpen: false,
    height: "50vh", // Initial collapsed height
    fullHeight: "100vh"
  });
  const [searchState, setSearchState] = useState({
    query: "",
    suggestions: [],
    isLoading: false,
    error: null
  });

  // Enhanced panel animations with smoother and shorter duration
  useEffect(() => {
    if (panelRef.current && contentRef.current) {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power2.inOut",
          duration: 0.3 // Shorter duration for smoother animation
        }
      });

      if (panelState.isOpen) {
        // Opening animation sequence
        timeline
          .to(panelRef.current, {
            height: panelState.fullHeight,
            duration: 0.1, // Shorter duration for smoother animation
            // ease: "elastic.out(1, 0.8)" // Elastic easing for bouncy effect
          })
          .to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.1, // Shorter duration for smoother animation
            delay: -0.3 // Overlap with panel animation
          });
      } else {
        // Closing animation sequence
        timeline
          .to(contentRef.current, {
            
            y: 20,
            duration: 0.4 // Shorter duration for smoother animation
          })
          .to(panelRef.current, {
            height: panelState.height,
            duration: 0.1, // Shorter duration for smoother animation
            ease: "power4.inOut",
            
          });
      }
    }
  }, [panelState.isOpen]);

  // Handle panel toggle with animation state
  const togglePanel = () => {
    setPanelState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };

  // Debounced search function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Handle search input changes
  const handleSearch = async (value) => {
    setSearchState(prev => ({
      ...prev,
      query: value,
      isLoading: true
    }));

    if (value.length < 3) {
      setSearchState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false
      }));
      return;
    }

    try {
      const response = await axios.get(`/api/locations/suggestions?query=${value}`);
      setSearchState(prev => ({
        ...prev,
        suggestions: response.data,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: "Failed to fetch suggestions"
      }));
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  // Handle suggestion selection with animation
  const handleSelectSuggestion = (suggestion) => {
    gsap.to(".suggestions-container", {
      opacity: 0,
      y: -10,
      duration: 0.3, // Shorter duration for smoother animation
      ease: "power2.inOut",
      onComplete: () => {
        setSearchState(prev => ({
          ...prev,
          query: suggestion.display_name,
          suggestions: []
        }));
      }
    });
  };

  // Handle input focus
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
            Drag the map to move the pin
          </h4>
          <hr className="mb-4 opacity-50 transition-opacity duration-500" />

          <div className="flex flex-col gap-4">
            <div className="relative transform transition-all duration-500">
              <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-300">
                <input
                  type="text"
                  placeholder="Search for a destination"
                  value={searchState.query}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  className="bg-transparent w-full outline-none border-0 transition-all duration-300"
                />
                {searchState.isLoading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-search-line"></i>
                )}
              </div>

              {searchState.suggestions.length > 0 && (
                <div className="suggestions-container absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 transform transition-all duration-500">
                  {searchState.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="p-3 text-gray-800 hover:bg-gray-100 cursor-pointer transition-all duration-300"
                      style={{
                        transitionDelay: `${index * 50}ms` // Staggered animation for suggestions
                      }}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}

              {searchState.error && (
                <div className="text-red-500 mt-2 text-sm transform transition-all duration-300">
                  {searchState.error}
                </div>
              )}
            </div>

            <button 
              className="bg-gray-300 w-full p-3 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-400 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => {/* Add confirmation logic */}}
            >
              Confirm destination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlan;
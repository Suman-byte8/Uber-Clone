import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import axios from "axios";
import LivePosition from "../../components/LivePosition";
import PickUpPanel from "../../components/PickUpPanel";
import ChooseRidePanel from "../../components/ChooseRidePanel";
import { useUserContext } from "../../components/UserContext";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const TripPlan = () => {
  const { userId } = useUserContext();
  const panelRef = useRef(null);
  const contentRef = useRef(null);

  const [panelState, setPanelState] = useState({
    isOpen: false,
    height: "90px",
    fullHeight: "100vh",
    paddingBottom: "3rem",
  });

  const [activeInput, setActiveInput] = useState(null);
  const [pickupState, setPickupState] = useState({ query: "", suggestions: [], isLoading: false, active: true, error: null });
  const [dropoffState, setDropoffState] = useState({ query: "", suggestions: [], isLoading: false, active: false, error: null, isVisible: false });
  const [location, setLocation] = useState();
  const [showChooseRidePanel, setShowChooseRidePanel] = useState(false);

  const fetchSuggestions = async (query, setState) => {
    if (!query.trim()) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      setState((prev) => ({ ...prev, suggestions: response.data, isLoading: false }));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
    }
  };

  const handleInputFocus = (type) => {
    setActiveInput(type);
    setPickupState((prev) => ({ ...prev, active: type === "pickup" }));
    setDropoffState((prev) => ({ ...prev, active: type === "dropoff" }));
    if (!panelState.isOpen) setPanelState((prev) => ({ ...prev, isOpen: true }));
  };

  const handlePickupSearch = useCallback(debounce((query) => {
    setPickupState((prev) => ({ ...prev, query }));
    fetchSuggestions(query, setPickupState);
  }, 300), []);

  const handleDropoffSearch = useCallback(debounce((query) => {
    setDropoffState((prev) => ({ ...prev, query }));
    fetchSuggestions(query, setDropoffState);
  }, 300), []);

  const fetchAndUpdateLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const currentLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setLocation(currentLocation);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
        const address = res.data.display_name;
        setPickupState((prev) => ({ ...prev, query: address }));
      } catch (e) {
        console.error("Error getting address:", e);
      }

      try {
        await axios.put(`${import.meta.env.VITE_BASE_URL}/api/locations/update-location`, {
          lat: currentLocation.lat,
          lon: currentLocation.lon,
          userId,
        });
      } catch (e) {
        console.error("Error updating user location:", e);
      }
    });
  };

  useEffect(() => {
    fetchAndUpdateLocation();
  }, []);

  useEffect(() => {
    if (!panelRef.current || !contentRef.current) return;

    const timeline = gsap.timeline();

    if (panelState.isOpen) {
      timeline
        .to(panelRef.current, {
          height: panelState.fullHeight,
          duration: 0.6,
          ease: "power2.out",
        })
        .to(contentRef.current, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.3");
    } else {
      timeline
        .to(contentRef.current, {
          autoAlpha: 0,
          y: 30,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .to(panelRef.current, {
          height: panelState.height,
          duration: 0.5,
          ease: "power3.inOut",
          paddingBottom: panelState.paddingBottom,
        }, "-=0.3");
    }

    setDropoffState((prev) => ({ ...prev, isVisible: panelState.isOpen }));
  }, [panelState.isOpen]);

  const togglePanel = () => setPanelState((prev) => ({ ...prev, isOpen: !prev.isOpen }));

  const handleSuggestionSelect = (suggestion) => {
    const display = suggestion.display_name;
    if (activeInput === "pickup") setPickupState((prev) => ({ ...prev, query: display, active: false }));
    else if (activeInput === "dropoff") setDropoffState((prev) => ({ ...prev, query: display, active: false, suggestions: [] }));
  };

  const handleConfirmTrip = () => {
    const timeline = gsap.timeline();
    timeline
      .to(contentRef.current, {
        autoAlpha: 0,
        y: 30,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .to(panelRef.current, {
        height: panelState.height,
        duration: 0.6,
        ease: "power3.inOut",
        paddingBottom: panelState.paddingBottom,
        onComplete: () => {
          setPanelState((prev) => ({ ...prev, isOpen: false }));
          setShowChooseRidePanel(true);
        },
      }, "-=0.3");
  };

  const handleBackToPickup = () => {
    setShowChooseRidePanel(false);
    setTimeout(() => {
      setPanelState((prev) => ({ ...prev, isOpen: true }));
    }, 400);
  };

  return (
    <div className="relative h-screen w-full">
      <button
        onClick={() => window.history.back()}
        className="rounded-full bg-[#252525] w-12 h-12 absolute top-4 left-4 text-white flex items-center justify-center z-10 hover:scale-105 transition-transform duration-300"
      >
        <i className="ri-arrow-left-line text-3xl"></i>
      </button>

      <div className="h-full w-full z-[1]">
        <LivePosition location={location} />
      </div>

      {!showChooseRidePanel && (
        <div
          ref={panelRef}
          className="w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl z-10"
          style={{ height: panelState.height, paddingBottom: panelState.paddingBottom }}
        >
          <button onClick={togglePanel} className="w-full h-10 flex items-center justify-center text-white">
            <i className={`ri-arrow-${panelState.isOpen ? "down" : "up"}-wide-line text-2xl transition-transform duration-500 ease-in-out ${panelState.isOpen ? "rotate-180" : ""}`} />
          </button>

          <PickUpPanel
            contentRef={contentRef}
            panelState={panelState}
            pickupState={pickupState}
            dropoffState={dropoffState}
            handleInputFocus={handleInputFocus}
            handlePickupSearch={handlePickupSearch}
            handleDropoffSearch={handleDropoffSearch}
            handleSuggestionSelect={handleSuggestionSelect}
            activeInput={activeInput}
            onConfirmTrip={handleConfirmTrip}
            setDropoffState={setDropoffState}
          />
        </div>
      )}

      {showChooseRidePanel && <ChooseRidePanel onBack={handleBackToPickup} isVisible={showChooseRidePanel} />}
    </div>
  );
};

export default TripPlan;

import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import axios from "axios";
import LivePosition from "../../components/LivePosition";
import PickUpPanel from "./PickUpPanel";
import ChooseRidePanel from "./ChooseRidePanel";
import { useUserContext } from "../../context/UserContext";
import { useSocket } from "../../context/SocketContext";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// Pricing tiers for different vehicle types
const PRICING_TIERS = {
  car: {
    basePrice: 30,
    pricePerKm: 2,
    pricePerMin: 1,
    name: "Uber X",
    icon: "🚗",
    maxPassengers: 4
  },
  auto: {
    basePrice: 25,
    pricePerKm: 1.5,
    pricePerMin: 0.8,
    name: "Auto",
    icon: "🛺",
    maxPassengers: 4
  },
  motorcycle: {
    basePrice: 20,
    pricePerKm: 1,
    pricePerMin: 0.5,
    name: "Motorcycle",
    icon: "🏍️",
    maxPassengers: 2
  }
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
  const [distance, setDistance] = useState(null);
  const [prices, setPrices] = useState({
    car: null,
    auto: null,
    motorcycle: null
  });
  const [estimatedTime, setEstimatedTime] = useState(null);
  
  const [pickupCords, setPickupCords] = useState(null);
  const [dropoffCords, setDropoffCords] = useState(null);
  
  const socket = useSocket();
  console.log("Socket instance in TripPlan:", socket);
  
  useEffect(() => {
    if (!socket) return;

    socket.on("rideCancelled", (data) => {
      console.log(`${data.cancelledBy} cancelled the ride`);
    });

    return () => {
      socket.off("rideCancelled");
    };
  }, [socket]);
  
  // function to fetch suggestions 
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

  // function to handle input focus
  const handleInputFocus = (type) => {
    setActiveInput(type);
    setPickupState((prev) => ({ ...prev, active: type === "pickup" }));
    setDropoffState((prev) => ({ ...prev, active: type === "dropoff" }));
    if (!panelState.isOpen) setPanelState((prev) => ({ ...prev, isOpen: true }));
  };

  // Update the fetchSuggestions function to be debounced
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query, setState) => {
      if (!query.trim()) return;
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        setState((prev) => ({ ...prev, suggestions: response.data, isLoading: false }));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
      }
    }, 600),
    []
  );

  // Update the handle search functions to directly update state and use debounced API call
  const handlePickupSearch = useCallback((query) => {
    setPickupState((prev) => ({ ...prev, query }));
    debouncedFetchSuggestions(query, setPickupState);
  }, [debouncedFetchSuggestions]);

  const handleDropoffSearch = useCallback((query) => {
    setDropoffState((prev) => ({ ...prev, query }));
    debouncedFetchSuggestions(query, setDropoffState);
  }, [debouncedFetchSuggestions]);

  // function to fetch and update user location
  // and address using OpenStreetMap Nominatim API
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
          role: "user"
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

  // function to handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const display = suggestion.display_name;
    if (activeInput === "pickup") setPickupState((prev) => ({ ...prev, query: display, active: false }));
    else if (activeInput === "dropoff") setDropoffState((prev) => ({ ...prev, query: display, active: false, suggestions: [] }));
  };


  // function to calculate distance and prices
  const calculateDistanceAndPrices = useCallback(async () => {
    if (!pickupState.query || !dropoffState.query) {
      setDistance(null);
      setPrices({
        car: null,
        auto: null,
        motorcycle: null
      });
      setEstimatedTime(null);
      return;
    }

    try {
      // Get coordinates for both locations
      const pickupResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupState.query)}`
      );
      const dropoffResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoffState.query)}`
      );

      const pickupData = pickupResponse.data;
      if (pickupData.length > 0) {
        setPickupCords({ lat: parseFloat(pickupData[0].lat), lng: parseFloat(pickupData[0].lon) });
      } else {
        setPickupCords(null);
      }
      const dropoffData = dropoffResponse.data;
      if (dropoffData.length > 0) {
        setDropoffCords({ lat: parseFloat(dropoffData[0].lat), lng: parseFloat(dropoffData[0].lon) });
      } else {
        setDropoffCords(null);
      }

      if (pickupData.length > 0 && dropoffData.length > 0) {
        const pickup = pickupData[0];
        const dropoff = dropoffData[0];

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const lat1 = pickup.lat * Math.PI / 180;
        const lat2 = dropoff.lat * Math.PI / 180;
        const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
        const dLon = (dropoff.lon - pickup.lon) * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1) * Math.cos(lat2) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceInKm = R * c;

        setDistance(distanceInKm);

        // Calculate prices for each vehicle type with time and distance
        const avgSpeedKmh = 25; // More realistic city speed
        const timeInHours = distanceInKm / avgSpeedKmh;
        const timeInMinutes = Math.round(timeInHours * 60);
        setEstimatedTime(timeInMinutes);

        const calculatedPrices = {};
        Object.entries(PRICING_TIERS).forEach(([type, tier]) => {
          const price = Math.round(
            tier.basePrice +
            (distanceInKm * tier.pricePerKm) +
            (timeInMinutes * tier.pricePerMin)
          );
          calculatedPrices[type] = price;
        });

        setPrices(calculatedPrices);
      }
    } catch (error) {
      console.error('Error calculating distance and prices:', error);
      setDistance(null);
      setPrices({
        car: null,
        auto: null,
        motorcycle: null
      });
      setEstimatedTime(null);
    }
  }, [pickupState.query, dropoffState.query]);

  // Calculate distance and prices when locations change
  useEffect(() => {
    calculateDistanceAndPrices();
  }, [calculateDistanceAndPrices]);

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
    <div className="relative h-screen w-full overflow-hidden">
      <button
        onClick={() => window.history.back()}
        className="rounded-full bg-[#252525] w-12 h-12 absolute top-4 left-4 text-white flex items-center justify-center z-10 hover:scale-105 transition-transform duration-300"
      >
        <i className="ri-arrow-left-line text-3xl"></i>
      </button>

      <div className="h-full w-full">
        <LivePosition 
          location={location}
          isDriver={false}
        />
      </div>

      {!showChooseRidePanel && (
        <div
          ref={panelRef}
          className="w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl z-10"
          style={{
            height: panelState.height,
            paddingBottom: panelState.isOpen ? panelState.paddingBottom : "0",
          }}
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

      {showChooseRidePanel && (
        <ChooseRidePanel 
          onBack={handleBackToPickup} 
          isVisible={showChooseRidePanel} 
          distance={distance}
          prices={prices}
          estimatedTime={estimatedTime}
          pricingTiers={PRICING_TIERS}
          pickupData={pickupCords}
          dropoffData={dropoffCords}
        />
      )}
    </div>
  );
};

export default TripPlan;



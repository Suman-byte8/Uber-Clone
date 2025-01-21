// TripPlan.jsx
import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import axios from "axios";
import LivePosition from "../../components/LivePosition";
import PickUpPanel from "../../components/PickUpPanel";
import { useUserContext } from "../../components/UserContext";
import { useNavigate } from "react-router-dom";

const TripPlan = () => {
  const { userId } = useUserContext();
  const navigate = useNavigate();
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

  const [location, setLocation] = useState();

  const fetchAndUpdateLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setLocation(currentLocation);

        if (!userId) {
          console.error("User ID is not available.");
          navigate("/user-login");
          return;
        }

        try {
          const response = await axios.put(
            `${import.meta.env.VITE_BASE_URL}/api/locations/update-location`,
            {
              lat: currentLocation.lat,
              lon: currentLocation.lon,
              userId,
            }
          );
          console.log("Location updated successfully:", response.data);
        } catch (error) {
          console.error(
            "Error updating user location:",
            error.response?.data || error.message
          );
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchAndUpdateLocation();
  }, []);

  useEffect(() => {
    if (!panelRef.current || !contentRef.current) return;

    const timeline = gsap.timeline({
      defaults: { ease: "power2.inOut" },
    });

    if (panelState.isOpen) {
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
      timeline
        .to(contentRef.current, {
          opacity: 0.8,
          y: 10,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .to(panelRef.current, {
          height: panelState.height,
          duration: 0.6,
          ease: "power4.inOut",
          paddingBottom: panelState.paddingBottom,
        });
    }

    setDropoffState((prev) => ({
      ...prev,
      isVisible: panelState.isOpen,
    }));
  }, [panelState.isOpen]);

  const togglePanel = () => {
    setPanelState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
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

      <div className="h-full w-full z-[1]">
        <LivePosition location={location} />
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
          handleInputFocus={handleInputFocus}
          setPickupState={setPickupState}
          setDropoffState={setDropoffState}
        />
      </div>
    </div>
  );
};

export default TripPlan;

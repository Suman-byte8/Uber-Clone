import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";

// SVG icon as a string
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364ZM12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15ZM12 13C10.8954 13 10 12.1046 10 11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11C14 12.1046 13.1046 13 12 13Z"></path></svg>`;

// Create a custom icon using the SVG
const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgIcon),
  iconSize: [25, 41], // Adjusted size
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const LivePosition = () => {
  const [location, setLocation] = useState(null);
  const [map, setMap] = useState(null); // State to hold the map instance

  // Function to get user's live coordinates
  const getUserCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log("New Location: ", newLocation);
          setLocation(newLocation);
        },
        (error) => {
          console.error("Error fetching live location: ", error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    getUserCoordinates(); // Start watching user's location on component mount
  }, []);

  const relocateToCurrentLocation = () => {
    if (map && location) {
      map.setView([location.lat, location.lon], 20); // Center the map on the user's location
      setLocation({ ...location }); // Trigger re-render by updating state
    }
    console.log("clicked")
  };

  return (
    <>


      <MapContainer
        center={
          location ? [location.lat, location.lon] : [25.0057449, 88.1398483]
        } // Default fallback location
        zoom={20}
        style={{ height: "100vh", width: "100%", zIndex: 1 }} // Set z-index for the map container
        whenCreated={setMap} // Set the map instance when created
        scrollWheelZoom={true}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* User Location Marker with custom SVG icon */}
        {location && (
          <Marker position={[location.lat, location.lon]} icon={customIcon}>
            <Popup>
              <span>Your Exact Location</span>
            </Popup>
          </Marker>
        )}

        <ZoomControl position="topright" />
      </MapContainer>
    </>
  );
};

export default LivePosition;

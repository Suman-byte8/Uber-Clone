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

const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgIcon),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const LivePosition = ({ location }) => {
  const [map, setMap] = useState(null);

  // Debugging location and map state
  useEffect(() => {
    console.log("Location state:", location);
    console.log("Map instance:", map);
  }, [location, map]);

  const relocateToCurrentLocation = () => {
    if (map && location) {
      map.setView([location.lat, location.lon], 15); // Center the map
      console.log("Map recentered to:", location);
    } else {
      console.warn("Location or map instance is unavailable.");
    }
  };

  const initialCenter = location ? [location.lat, location.lon] : [0, 0];

  return (
    <div>
      {location ? (
        <MapContainer
          center={initialCenter}
          zoom={15}
          style={{ height: "100vh", width: "100%",zIndex:"1" }}
          whenCreated={setMap} // Capture map instance when created
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[location.lat, location.lon]} icon={customIcon}>
            <Popup>
              <span>Your Exact Location</span>
            </Popup>
          </Marker>
          <ZoomControl position="topright" />
        </MapContainer>
      ) : (
        <div className="text-center mt-4">Loading map...</div>
      )}

      <button
        onClick={relocateToCurrentLocation}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg"
      >
        Recenter
      </button>
    </div>
  );
};

export default LivePosition;

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
});

// Custom icons for driver and rider
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const driverIcon = createCustomIcon('#4A90E2');
const riderIcon = createCustomIcon('#50C878');

const MapController = ({ location, driverLocation, isDriver, isRideActive, showRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    console.log("MapController received:", { 
      location, 
      driverLocation, 
      isDriver, 
      isRideActive, 
      showRoute 
    });

    // If we only have one location (no route needed)
    if (!isRideActive || !showRoute || !driverLocation) {
      if (location) {
        console.log("Centering map on primary location:", location);
        map.setView([location.lat, location.lon || location.lng], 15);
      }
      return;
    }

    // If we have both locations and should show route
    if (location && driverLocation) {
      try {
        // Normalize location formats
        const loc1 = {
          lat: location.lat,
          lng: location.lon || location.lng
        };
        
        const loc2 = {
          lat: driverLocation.lat,
          lng: driverLocation.lon || driverLocation.lng
        };
        
        console.log("Creating route between:", {
          primary: [loc1.lat, loc1.lng],
          secondary: [loc2.lat, loc2.lng]
        });
        
        // Create bounds
        const bounds = L.latLngBounds(
          [loc1.lat, loc1.lng],
          [loc2.lat, loc2.lng]
        ).pad(0.1);
        
        console.log("Setting map bounds:", bounds);
        map.fitBounds(bounds);
        
        // Draw route line
        const routeCoordinates = [
          [loc1.lat, loc1.lng],
          [loc2.lat, loc2.lng]
        ];
        
        console.log("Drawing route with coordinates:", routeCoordinates);
        
        // Clear existing polylines
        map.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
          }
        });
        
        // Add new route line
        L.polyline(routeCoordinates, {
          color: '#0066FF',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map);
      } catch (error) {
        console.error("Error in MapController:", error);
      }
    }
  }, [map, location, driverLocation, isDriver, isRideActive, showRoute]);

  return null;
};

const LivePosition = ({ 
  location,
  driverLocation,
  isDriver = false,
  isRideActive = false,
  showRoute = false,
  onMapReady = () => {} 
}) => {
  const [map, setMap] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log("LivePosition component received props:", {
      location,
      driverLocation,
      isDriver,
      isRideActive,
      showRoute
    });
  }, [location, driverLocation, isDriver, isRideActive, showRoute]);

  useEffect(() => {
    if (map) {
      console.log("Map instance ready, calling onMapReady");
      map.invalidateSize();
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Ensure we have valid location data
  if (!location) {
    console.log("No primary location provided to LivePosition");
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Normalize location format
  const primaryLocation = {
    lat: location.lat,
    lng: location.lon || location.lng
  };

  // Normalize driver location if available
  const secondaryLocation = driverLocation ? {
    lat: driverLocation.lat,
    lng: driverLocation.lon || driverLocation.lng
  } : null;

  console.log("Rendering map with:", {
    primaryLocation,
    secondaryLocation,
    showRoute
  });

  return (
    <MapContainer
      center={[primaryLocation.lat, primaryLocation.lng]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      whenCreated={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Primary location marker (rider or driver depending on isDriver) */}
      <Marker 
        position={[primaryLocation.lat, primaryLocation.lng]} 
        icon={isDriver ? driverIcon : riderIcon}
      >
        <Popup>
          {isDriver ? "Your location" : "Your location"}
        </Popup>
      </Marker>
      
      {/* Secondary location marker (if available) */}
      {secondaryLocation && (
        <Marker 
          position={[secondaryLocation.lat, secondaryLocation.lng]} 
          icon={isDriver ? riderIcon : driverIcon}
        >
          <Popup>
            {isDriver ? "Rider location" : "Driver location"}
          </Popup>
        </Marker>
      )}
      
      {/* Map controller for centering and route drawing */}
      <MapController 
        location={primaryLocation}
        driverLocation={secondaryLocation}
        isDriver={isDriver}
        isRideActive={isRideActive}
        showRoute={showRoute && !!secondaryLocation}
      />
    </MapContainer>
  );
};

export default LivePosition;

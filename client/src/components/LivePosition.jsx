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

const MapController = ({ driverLocation, riderLocation, isRideActive }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    console.log("MapController received:", { driverLocation, riderLocation, isRideActive });

    if (isRideActive && driverLocation && riderLocation) {
      // Create bounds
      const bounds = L.latLngBounds(
        [driverLocation.lat, driverLocation.lon],
        [riderLocation.lat, riderLocation.lon || riderLocation.lng]
      ).pad(0.1);
      
      map.fitBounds(bounds);
      
      // Draw route line
      const routeCoordinates = [
        [driverLocation.lat, driverLocation.lon],
        [riderLocation.lat, riderLocation.lon || riderLocation.lng]
      ];
      
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
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(map);
    }
  }, [map, driverLocation, riderLocation, isRideActive]);

  return null;
};

const LivePosition = ({ 
  location,
  driverLocation,
  isDriver = false,
  isRideActive,
  showRoute = false,
  onMapReady = () => {} 
}) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map) {
      map.invalidateSize();
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    console.log("Location prop:", location);
    console.log("Driver location prop:", driverLocation);
  }, [location, driverLocation]);

  if (!location) {
    console.log("No location provided");
    return <div>Loading map...</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={[location.lat, location.lon]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        whenCreated={setMap}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='This application is Developed by Suman Saha !'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Current Location Marker */}
        <Marker
          position={[location.lat, location.lon]}
          icon={isDriver ? driverIcon : riderIcon}
        >
          <Popup>Your Location</Popup>
        </Marker>

        {/* Other Party's Location Marker */}
        {showRoute && driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lon]}
            icon={isDriver ? riderIcon : driverIcon}
          >
            <Popup>
              {isDriver ? 'Rider Location' : 'Driver Location'}
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {showRoute && driverLocation && location && (
          <MapController
            driverLocation={driverLocation}
            riderLocation={location}
            isRideActive={isRideActive}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LivePosition;

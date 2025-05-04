// MapViewer.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const MapViewer = ({ livePosition }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao',
    libraries: ['places'],
    csp: {
      scriptSrc: ['self', 'https://maps.googleapis.com'],
    },
  });

  const [map, setMap] = useState(null);

  useEffect(() => {
    if (livePosition) {
      const latLng = {
        lat: livePosition.latitude,
        lng: livePosition.longitude,
      };
      if (map) {
        map.panTo(latLng);
        map.setZoom(15);
      }
    }
  }, [livePosition, map]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  return (
    <div className="map-view flex-grow flex items-center justify-center text-gray-400 bg-gray-50 rounded my-4">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ height: '400px', width: '100%' }}
          center={livePosition}
          zoom={15}
          onLoad={onMapLoad}
        >
          {livePosition && (
            <Marker position={livePosition} />
          )}
        </GoogleMap>
      ) : (
        <p>Loading Map...</p>
      )}
    </div>
  );
};

export default MapViewer;
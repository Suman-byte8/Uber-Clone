import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer as Map, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';
import { useUserContext } from '../../context/UserContext';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const createIcon = (iconUrl) => {
  return L.icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const userIcon = createIcon('/markers/user-marker.png');
const driverIcon = createIcon('/markers/car-marker.png');
const pickupIcon = createIcon('/markers/pickup-marker.png');
const dropoffIcon = createIcon('/markers/dropoff-marker.png');

const RideTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { userId } = useUserContext();
  const mapRef = useRef(null);
  
  // Get ride details from location state
  const { captainDetails, rideDetails } = location.state || {};
  
  const [rideStatus, setRideStatus] = useState('ACCEPTED');
  const [captainLocation, setCaptainLocation] = useState(captainDetails?.currentLocation || null);
  const [estimatedArrival, setEstimatedArrival] = useState(captainDetails?.estimatedArrival || 5);
  
  // Redirect if no ride details
  useEffect(() => {
    if (!rideDetails || !captainDetails) {
      navigate('/');
    }
  }, [rideDetails, captainDetails, navigate]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket || !rideDetails?.rideId) return;
    
    // Handle captain location updates
    const handleCaptainLocationUpdate = (data) => {
      if (data.captainId === captainDetails.id) {
        setCaptainLocation(data.location);
        
        // Update estimated arrival time
        if (rideStatus === 'ACCEPTED' && data.estimatedArrival) {
          setEstimatedArrival(data.estimatedArrival);
        }
      }
    };
    
    // Handle ride status updates
    const handleRideStatusUpdate = (data) => {
      if (data.rideId === rideDetails.rideId) {
        setRideStatus(data.status);
      }
    };
    
    // Handle captain arrived at pickup
    const handleCaptainArrived = (data) => {
      if (data.rideId === rideDetails.rideId) {
        setRideStatus('CAPTAIN_ARRIVED');
        
        // Show notification
        if (Notification.permission === "granted") {
          const notification = new Notification("Captain Arrived", {
            body: `${captainDetails.name} has arrived at your pickup location.`,
            icon: "/logo.png"
          });
        }
      }
    };
    
    // Handle ride started
    const handleRideStarted = (data) => {
      if (data.rideId === rideDetails.rideId) {
        setRideStatus('RIDE_STARTED');
      }
    };
    
    // Handle ride completed
    const handleRideCompleted = (data) => {
      if (data.rideId === rideDetails.rideId) {
        setRideStatus('RIDE_COMPLETED');
        
        // Navigate to ride summary after a delay
        setTimeout(() => {
          navigate('/ride-summary', { 
            state: { 
              captainDetails, 
              rideDetails,
              fareDetails: data.fareDetails
            } 
          });
        }, 3000);
      }
    };
    
    // Handle ride cancelled
    const handleRideCancelled = (data) => {
      if (data.rideId === rideDetails.rideId) {
        setRideStatus('RIDE_CANCELLED');
        
        // Show notification
        if (Notification.permission === "granted") {
          const notification = new Notification("Ride Cancelled", {
            body: `Your ride has been cancelled. ${data.reason || ''}`,
            icon: "/logo.png"
          });
        }
        
        // Navigate back to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    
    // Register event listeners
    socket.on('captainLocationUpdate', handleCaptainLocationUpdate);
    socket.on('rideStatusUpdate', handleRideStatusUpdate);
    socket.on('captainArrived', handleCaptainArrived);
    socket.on('rideStarted', handleRideStarted);
    socket.on('rideCompleted', handleRideCompleted);
    socket.on('rideCancelled', handleRideCancelled);
    
    // Cleanup event listeners
    return () => {
      socket.off('captainLocationUpdate', handleCaptainLocationUpdate);
      socket.off('rideStatusUpdate', handleRideStatusUpdate);
      socket.off('captainArrived', handleCaptainArrived);
      socket.off('rideStarted', handleRideStarted);
      socket.off('rideCompleted', handleRideCompleted);
      socket.off('rideCancelled', handleRideCancelled);
    };
  }, [socket, rideDetails, captainDetails, navigate, rideStatus]);
  
  // Cancel ride
  const handleCancelRide = () => {
    if (!socket || !rideDetails?.rideId) return;
    
    socket.emit('cancelRide', {
      rideId: rideDetails.rideId,
      userId,
      cancelledBy: 'user',
      reason: 'Cancelled by user'
    }, (response) => {
      if (response.status === 'success') {
        navigate('/');
      }
    });
  };
  
  // Get status text
  const getStatusText = () => {
    switch (rideStatus) {
      case 'ACCEPTED':
        return `Captain is on the way (${estimatedArrival} min)`;
      case 'CAPTAIN_ARRIVED':
        return 'Captain has arrived at pickup location';
      case 'RIDE_STARTED':
        return 'Ride in progress';
      case 'RIDE_COMPLETED':
        return 'Ride completed';
      case 'RIDE_CANCELLED':
        return 'Ride cancelled';
      default:
        return 'Finding your captain';
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold">Ride Tracking</h1>
        <p className="text-sm">{getStatusText()}</p>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        {rideDetails && (
          <Map
            center={rideDetails.pickupLocation ? [rideDetails.pickupLocation.lat, rideDetails.pickupLocation.lng] : [0, 0]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Pickup Location Marker */}
            {rideDetails.pickupLocation && (
              <Marker 
                position={[rideDetails.pickupLocation.lat, rideDetails.pickupLocation.lng]} 
                icon={pickupIcon}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">Pickup Location</p>
                    <p className="text-sm text-gray-600">
                      {rideDetails.pickupLocation.address || 'Unknown location'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Dropoff Location Marker */}
            {rideDetails.dropoffLocation && (
              <Marker 
                position={[rideDetails.dropoffLocation.lat, rideDetails.dropoffLocation.lng]} 
                icon={dropoffIcon}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">Dropoff Location</p>
                    <p className="text-sm text-gray-600">
                      {rideDetails.dropoffLocation.address || 'Unknown location'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Captain Location Marker */}
            {captainLocation && (
              <Marker 
                position={[captainLocation.lat, captainLocation.lng]} 
                icon={driverIcon}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">{captainDetails.name}</p>
                    <p className="text-sm text-gray-600">
                      {captainDetails.vehicleDetails?.model || 'Vehicle'} - {captainDetails.vehicleDetails?.color || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {captainDetails.vehicleDetails?.licensePlate || 'No plate info'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </Map>
        )}
      </div>
      
      {/* Captain Details Panel */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xl">{captainDetails?.name?.charAt(0) || 'C'}</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="font-medium">{captainDetails?.name || 'Captain'}</p>
            <div className="flex items-center">
              <span className="text-yellow-500">★</span>
              <span className="text-sm ml-1">{captainDetails?.rating || '4.5'}</span>
            </div>
          </div>
          {captainDetails?.phoneNumber && (
            <a 
              href={`tel:${captainDetails.phoneNumber}`} 
              className="bg-gray-100 p-2 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          )}
        </div>
        
        {/* Vehicle Details */}
        <div className="bg-gray-100 p-3 rounded mb-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Vehicle</p>
              <p className="font-medium">{captainDetails?.vehicleDetails?.model || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Color</p>
              <p className="font-medium">{captainDetails?.vehicleDetails?.color || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">License Plate</p>
              <p className="font-medium">{captainDetails?.vehicleDetails?.licensePlate || 'Unknown'}</p>
            </div>
          </div>
        </div>
        
        {/* Ride Details */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Ride Type</p>
            <p className="font-medium capitalize">{rideDetails?.rideType || 'Standard'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Price</p>
            <p className="font-medium">${rideDetails?.price || '0'}</p>
          </div>
        </div>
        
        {/* Action Button */}
        {rideStatus !== 'RIDE_COMPLETED' && rideStatus !== 'RIDE_CANCELLED' && (
          <button
            onClick={handleCancelRide}
            className="w-full py-3 bg-red-500 text-white rounded font-medium"
          >
            Cancel Ride
          </button>
        )}
      </div>
    </div>
  );
};

export default RideTracking;

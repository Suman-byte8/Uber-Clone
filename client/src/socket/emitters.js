/**
 * Socket event emitters
 * 
 * This module provides functions to emit socket events to the server.
 * Each function now accepts a socket instance parameter to ensure
 * the authenticated socket from context is used.
 */

/**
 * Update the user's location
 * @param {Object} socket - The socket instance to use
 * @param {Object} locationData - The location data to send
 * @param {number} locationData.lat - Latitude
 * @param {number} locationData.lon - Longitude
 * @param {string} locationData.userId - User ID
 * @param {string} locationData.role - User role (user/captain)
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const updateLocation = (socket, locationData) => {
  if (socket && socket.connected) {
    socket.emit('updateLocation', locationData);
    return true;
  }
  console.warn('Socket not connected. Location update not sent.', locationData);
  return false;
};

/**
 * Request a ride
 * @param {Object} socket - The socket instance to use
 * @param {Object} rideData - The ride request data
 * @param {string} rideData.userId - User ID requesting the ride
 * @param {Object} rideData.pickup - Pickup location {lat, lon, address}
 * @param {Object} rideData.dropoff - Dropoff location {lat, lon, address}
 * @param {string} rideData.rideType - Type of ride (car, auto, motorcycle)
 * @param {number} rideData.estimatedPrice - Estimated price
 * @param {number} rideData.estimatedTime - Estimated time in minutes
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const requestRide = (socket, rideData) => {
  if (socket && socket.connected) {
    socket.emit('requestRide', {
      ...rideData,
      requestTime: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket not connected. Ride request not sent.');
  return false;
};

/**
 * Accept a ride request (for captains)
 * @param {Object} socket - The socket instance to use
 * @param {Object} acceptData - The ride acceptance data
 * @param {string} acceptData.rideId - ID of the ride being accepted
 * @param {string} acceptData.captainId - ID of the captain accepting the ride
 * @param {Object} acceptData.captainLocation - Current location of the captain
 * @param {number} acceptData.estimatedArrival - Estimated arrival time in minutes
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const acceptRide = (socket, acceptData) => {
  if (socket && socket.connected) {
    socket.emit('acceptRide', {
      ...acceptData,
      acceptTime: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket not connected. Ride acceptance not sent.');
  return false;
};

/**
 * Reject a ride request (for captains)
 * @param {Object} socket - The socket instance to use
 * @param {Object} rejectData - The ride rejection data
 * @param {string} rejectData.rideId - ID of the ride being rejected
 * @param {string} rejectData.captainId - ID of the captain rejecting the ride
 * @param {string} rejectData.reason - Optional reason for rejection
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const rejectRide = (socket, rejectData) => {
  if (socket && socket.connected) {
    socket.emit('rejectRide', {
      ...rejectData,
      rejectTime: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket not connected. Ride rejection not sent.');
  return false;
};

/**
 * Cancel an ongoing ride (for both users and captains)
 * @param {Object} socket - The socket instance to use
 * @param {Object} cancelData - The ride cancellation data
 * @param {string} cancelData.rideId - ID of the ride being cancelled
 * @param {string} cancelData.userId - ID of the user who booked the ride
 * @param {string} cancelData.captainId - ID of the captain assigned to the ride
 * @param {string} cancelData.cancelledBy - Who cancelled the ride ('user' or 'captain')
 * @param {string} cancelData.reason - Optional reason for cancellation
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const cancelRide = (socket, data) => {
  if (socket && socket.connected) {
    socket.emit('cancelRide', {
      rideId: data.rideId,
      cancelledBy: data.cancelledBy
    });
    return true;
  }
  console.warn('Socket not connected. Ride cancellation not sent.', data);
  return false;
};

/**
 * Join a specific room (for private communications)
 * @param {Object} socket - The socket instance to use
 * @param {string} roomId - The room ID to join
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const joinRoom = (socket, roomId) => {
  if (socket && socket.connected) {
    socket.emit('join', { roomId });
    return true;
  }
  console.warn('Socket not connected. Could not join room.');
  return false;
};

/**
 * Leave a specific room
 * @param {Object} socket - The socket instance to use
 * @param {string} roomId - The room ID to leave
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const leaveRoom = (socket, roomId) => {
  if (socket && socket.connected) {
    socket.emit('leave', { roomId });
    return true;
  }
  console.warn('Socket not connected. Could not leave room.');
  return false;
};

/**
 * Register a captain with the socket server
 * @param {Object} socket - The socket instance to use
 * @param {Object} captainData - The captain registration data
 * @param {string} captainData.captainId - ID of the captain
 * @param {Object} captainData.location - Current location of the captain {lat, lng}
 * @param {boolean} captainData.isActive - Whether the captain is active/online
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const registerCaptain = (socket, captainData) => {
  if (socket && socket.connected) {
    console.log('Registering captain with socket server:', captainData);
    socket.emit('registerCaptain', {
      ...captainData,
      registrationTime: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket not connected. Captain registration not sent.');
  return false;
};

/**
 * Update captain's location
 * @param {Object} socket - The socket instance to use
 * @param {Object} locationData - The location data to send
 * @param {string} locationData.captainId - ID of the captain
 * @param {Object} locationData.location - Current location {lat, lng}
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const updateCaptainLocation = (socket, locationData) => {
  if (socket && socket.connected) {
    socket.emit('updateCaptainLocation', locationData);
    return true;
  }
  console.warn('Socket not connected. Captain location update not sent.');
  return false;
};


export const startCancellationTimer = (socket, data) => {
  if (socket && socket.connected) {
    socket.emit('startCancellationTimer', {
      rideId: data.rideId,
      time: data.time
    });
    return true;
  }
  console.warn('Socket not connected. Cancellation timer not started.', data);
  return false;
}

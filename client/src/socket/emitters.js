import { getSocket } from './index';
import * as events from './events';

/**
 * Socket event emitters
 * 
 * This module provides functions to emit socket events to the server.
 * Each function handles a specific type of event and ensures the socket
 * is properly initialized before emitting.
 */

/**
 * Update the user's location
 * @param {Object} locationData - The location data to send
 * @param {number} locationData.lat - Latitude
 * @param {number} locationData.lon - Longitude
 * @param {string} locationData.userId - User ID
 * @param {string} locationData.role - User role (user/captain)
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const updateLocation = (locationData) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit(events.UPDATE_LOCATION, locationData);
    return true;
  }
  console.warn('Socket not connected. Location update not sent.');
  return false;
};

/**
 * Request a ride
 * @param {Object} rideData - The ride request data
 * @param {string} rideData.userId - User ID requesting the ride
 * @param {Object} rideData.pickup - Pickup location {lat, lon, address}
 * @param {Object} rideData.dropoff - Dropoff location {lat, lon, address}
 * @param {string} rideData.rideType - Type of ride (car, auto, motorcycle)
 * @param {number} rideData.estimatedPrice - Estimated price
 * @param {number} rideData.estimatedTime - Estimated time in minutes
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const requestRide = (rideData) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit(events.REQUEST_RIDE, {
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
 * @param {Object} acceptData - The ride acceptance data
 * @param {string} acceptData.rideId - ID of the ride being accepted
 * @param {string} acceptData.captainId - ID of the captain accepting the ride
 * @param {Object} acceptData.captainLocation - Current location of the captain
 * @param {number} acceptData.estimatedArrival - Estimated arrival time in minutes
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const acceptRide = (acceptData) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit(events.ACCEPT_RIDE, {
      ...acceptData,
      acceptTime: new Date().toISOString()
    });
    return true;
  }
  console.warn('Socket not connected. Ride acceptance not sent.');
  return false;
};

/**
 * Join a specific room (for private communications)
 * @param {string} roomId - The room ID to join
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const joinRoom = (roomId) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('join', { roomId });
    return true;
  }
  console.warn('Socket not connected. Could not join room.');
  return false;
};

/**
 * Leave a specific room
 * @param {string} roomId - The room ID to leave
 * @returns {boolean} - True if the event was emitted, false otherwise
 */
export const leaveRoom = (roomId) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('leave', { roomId });
    return true;
  }
  console.warn('Socket not connected. Could not leave room.');
  return false;
};

// Add more emitter functions as needed

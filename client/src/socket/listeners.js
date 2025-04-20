import { getSocket } from './index';
import * as events from './events';

/**
 * Socket event listeners
 * 
 * This module provides functions to set up listeners for socket events from the server.
 * Each function handles a specific type of event and ensures the socket
 * is properly initialized before setting up the listener.
 */

/**
 * Set up a listener for location updates
 * @param {Function} callback - Function to call when a location update is received
 * @returns {Function} - Function to remove the listener
 */
export const onLocationUpdated = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on(events.LOCATION_UPDATED, callback);
    
    // Return a function to remove the listener
    return () => {
      socket.off(events.LOCATION_UPDATED, callback);
    };
  }
  
  console.warn('Socket not initialized. Location update listener not set up.');
  return () => {}; // Return empty function if socket not available
};

/**
 * Set up a listener for new ride requests (for captains)
 * @param {Function} callback - Function to call when a new ride request is received
 * @returns {Function} - Function to remove the listener
 */
export const onNewRideRequest = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on(events.NEW_RIDE_REQUEST, callback);
    
    return () => {
      socket.off(events.NEW_RIDE_REQUEST, callback);
    };
  }
  
  console.warn('Socket not initialized. New ride request listener not set up.');
  return () => {};
};

/**
 * Set up a listener for ride acceptance (for users)
 * @param {Function} callback - Function to call when a ride is accepted
 * @returns {Function} - Function to remove the listener
 */
export const onRideAccepted = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on(events.RIDE_ACCEPTED, callback);
    
    return () => {
      socket.off(events.RIDE_ACCEPTED, callback);
    };
  }
  
  console.warn('Socket not initialized. Ride accepted listener not set up.');
  return () => {};
};

/**
 * Set up a listener for socket connection
 * @param {Function} callback - Function to call when socket connects
 * @returns {Function} - Function to remove the listener
 */
export const onConnect = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on(events.CONNECT, callback);
    
    return () => {
      socket.off(events.CONNECT, callback);
    };
  }
  
  console.warn('Socket not initialized. Connect listener not set up.');
  return () => {};
};

/**
 * Set up a listener for socket disconnection
 * @param {Function} callback - Function to call when socket disconnects
 * @returns {Function} - Function to remove the listener
 */
export const onDisconnect = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on(events.DISCONNECT, callback);
    
    return () => {
      socket.off(events.DISCONNECT, callback);
    };
  }
  
  console.warn('Socket not initialized. Disconnect listener not set up.');
  return () => {};
};

/**
 * Set up a listener for connection errors
 * @param {Function} callback - Function to call when a connection error occurs
 * @returns {Function} - Function to remove the listener
 */
export const onConnectionError = (callback) => {
  const socket = getSocket();
  
  if (socket) {
    socket.on('connect_error', callback);
    
    return () => {
      socket.off('connect_error', callback);
    };
  }
  
  console.warn('Socket not initialized. Connection error listener not set up.');
  return () => {};
};

// Add more listener setup functions as needed

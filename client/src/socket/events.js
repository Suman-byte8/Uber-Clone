/**
 * Socket event name constants
 * 
 * This file centralizes all socket event names used in the application.
 * Using constants instead of string literals helps prevent typos and
 * makes it easier to track and update event names.
 */

// Connection events
export const CONNECT = 'connect';
export const DISCONNECT = 'disconnect';

// Location events
export const UPDATE_LOCATION = 'updateLocation';
export const LOCATION_UPDATED = 'locationUpdated';

// Ride events
export const REQUEST_RIDE = 'requestRide';
export const NEW_RIDE_REQUEST = 'newRideRequest';
export const ACCEPT_RIDE = 'acceptRide';
export const RIDE_ACCEPTED = 'rideAccepted';

// Add more event constants as needed

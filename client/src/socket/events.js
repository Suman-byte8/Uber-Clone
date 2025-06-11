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
export const REJECT_RIDE = 'rejectRide';
export const RIDE_REJECTED = 'rideRejected';
export const CANCEL_RIDE = 'cancelRide';
export const RIDE_CANCELLED = 'rideCancelled';

// Add these new event constants
export const DRIVER_NEAR_PICKUP = 'driverNearPickup';
export const RIDE_OTP_GENERATED = 'rideOtpGenerated';
export const VERIFY_OTP = 'verifyOtp';
export const OTP_VERIFICATION_RESULT = 'otpVerificationResult';
export const OTP_VERIFIED = 'otpVerified';
export const START_RIDE = 'startRide';
export const RIDE_STARTED = 'rideStarted';
export const COMPLETE_RIDE = 'completeRide';
export const RIDE_COMPLETED = 'rideCompleted';

// In-memory stores
const connectedUsers = {}; // { userId: socketId }
const connectedCaptains = {}; // { captainId: { socketId, location, isOnline, ... } }
const pendingRideRequests = {}; // { rideId: { ... } }
const rides = {}; // { rideId: { ... } }
const otpStore = new Map(); // { rideId: { otp, generatedAt, verified } }

module.exports = {
  connectedUsers,
  connectedCaptains,
  pendingRideRequests,
  rides,
  otpStore
};
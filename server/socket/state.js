// In-memory stores
const connectedUsers = {}; // { userId: socketId }
const connectedCaptains = {}; // { captainId: { socketId, location, isOnline, ... } }
const pendingRideRequests = {}; // { rideId: { ... } }
const rides = {}; // { rideId: { ... } }

module.exports = {
  connectedUsers,
  connectedCaptains,
  pendingRideRequests,
  rides
};
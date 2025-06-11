// In-memory stores
const connectedUsers = {};
const connectedCaptains = {};
const pendingRideRequests = {};
const rides = {};
const otpStore = new Map();

// Add logging for debugging
const originalSet = otpStore.set;
otpStore.set = function(key, value) {
  console.log("🔑 Storing OTP:", { key, value });
  return originalSet.call(this, key, value);
};

module.exports = {
  connectedUsers,
  connectedCaptains,
  pendingRideRequests,
  rides,
  otpStore
};
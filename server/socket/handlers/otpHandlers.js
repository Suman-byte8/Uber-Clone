// Create a new file for OTP-related handlers
const { otpStore, rides, connectedUsers, connectedCaptains } = require('../state');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired OTPs
function cleanupExpiredOtps() {
  const now = Date.now();
  for (const [rideId, otpData] of otpStore.entries()) {
    if (now - otpData.generatedAt > 30 * 60 * 1000) { // 30 minutes
      otpStore.delete(rideId);
    }
  }
}

// Setup OTP handlers
function setupOtpHandlers(io, socket) {
  console.log('🔑 Setting up OTP handlers for socket:', socket.id);

  socket.on('requestOtp', async (data) => {
    console.log('🔑 SERVER: Received OTP request:', data);
    const { rideId, userId, captainId } = data;

    try {
      const otp = generateOtp();
      console.log('🔑 SERVER: Generated OTP:', otp, 'for ride:', rideId);

      otpStore.set(rideId, {
        otp,
        generatedAt: Date.now(),
        verified: false,
        userId,
        captainId
      });

      // FIX: Check if riderSocket is a string (socket ID) or object
      const riderSocketId = typeof connectedUsers[userId] === 'string' 
        ? connectedUsers[userId] 
        : connectedUsers[userId]?.socketId;
      
      console.log('🔑 SERVER: Looking for rider socket:', riderSocketId, 'for user:', userId);
      console.log('🔑 SERVER: Connected users:', Object.keys(connectedUsers));

      if (riderSocketId) {
        io.to(riderSocketId).emit('rideOtpGenerated', {
          rideId,
          otp,
          message: 'Share this OTP with your driver'
        });
        console.log('🔑 SERVER: OTP sent to rider socket:', riderSocketId);
      } else {
        console.log('❌ SERVER: Rider socket not found for user:', userId);
        console.log('❌ SERVER: Available users:', Object.keys(connectedUsers));
      }

      // ALSO emit to the requesting socket (in case it's the rider)
      socket.emit('rideOtpGenerated', {
        rideId,
        otp,
        message: 'Share this OTP with your driver'
      });
      console.log('🔑 SERVER: OTP also sent to requesting socket:', socket.id);

    } catch (error) {
      console.error('❌ SERVER: Error in OTP generation:', error);
    }
  });

  // Verify OTP handler
  socket.on('verifyOtp', (data) => {
    const { rideId, otp } = data;
    console.log("🔑 SERVER: Verifying OTP:", { rideId, otp });

    const storedData = otpStore.get(rideId);
    if (!storedData) {
      socket.emit('otpVerificationResult', {
        rideId,
        success: false,
        reason: 'expired'
      });
      return;
    }

    const isValid = storedData.otp === otp;
    console.log("🔑 SERVER: OTP validation result:", { 
      isValid, 
      stored: storedData.otp, 
      received: otp 
    });

    if (isValid) {
      // Update OTP status
      storedData.verified = true;
      otpStore.set(rideId, storedData);

      // Update ride status
      if (rides[rideId]) {
        rides[rideId].status = 'otp_verified';
      }

      // Notify both parties
      socket.emit('otpVerificationResult', {
        rideId,
        success: true
      });

      // ADD: More detailed logging for rider notification
      const riderSocketId = typeof connectedUsers[storedData.userId] === 'string' 
        ? connectedUsers[storedData.userId] 
        : connectedUsers[storedData.userId]?.socketId;
      
      console.log('🔑 SERVER: Attempting to notify rider:', storedData.userId);
      console.log('🔑 SERVER: Rider socket ID:', riderSocketId);
      console.log('🔑 SERVER: All connected users:', Object.keys(connectedUsers));

      if (riderSocketId) {
        io.to(riderSocketId).emit('otpVerified', { rideId });
        console.log('✅ SERVER: OTP verification sent to rider socket:', riderSocketId);
      } else {
        console.log('❌ SERVER: Could not find rider socket for user:', storedData.userId);
      }

      // Notify driver
      const driverSocket = connectedCaptains[storedData.captainId]?.socketId;
      console.log('🔑 SERVER: Attempting to notify driver:', storedData.captainId);
      console.log('🔑 SERVER: Driver socket ID:', driverSocket);
      
      if (driverSocket) {
        io.to(driverSocket).emit('otpVerified', { rideId });
        console.log('✅ SERVER: OTP verification sent to driver socket:', driverSocket);
      } else {
        console.log('❌ SERVER: Could not find driver socket for captain:', storedData.captainId);
      }

      // ADD: Broadcast to all sockets as fallback (for debugging)
      io.emit('otpVerified', { 
        rideId, 
        userId: storedData.userId, 
        captainId: storedData.captainId,
        debug: 'broadcast_fallback'
      });
      console.log('📡 SERVER: Broadcasting OTP verification to all clients as fallback');

    } else {
      socket.emit('otpVerificationResult', {
        rideId,
        success: false,
        reason: 'invalid'
      });
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOtps, 5 * 60 * 1000);

module.exports = {
  setupOtpHandlers
};
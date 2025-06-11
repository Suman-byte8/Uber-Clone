// Create a new file for OTP-related handlers
const { otpStore, rides } = require('../state');

// Generate a 6-digit OTP
function generateOtp(rideId) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(rideId, {
    otp,
    generatedAt: Date.now(),
    verified: false
  });
  return otp;
}

// Verify an OTP
function verifyOtp(rideId, inputOtp) {
  const otpData = otpStore.get(rideId);
  if (!otpData) return { valid: false, reason: 'expired' };
  
  // Check if OTP is expired (15 minutes)
  if (Date.now() - otpData.generatedAt > 15 * 60 * 1000) {
    otpStore.delete(rideId);
    return { valid: false, reason: 'expired' };
  }
  
  // Verify OTP
  if (otpData.otp === inputOtp) {
    otpData.verified = true;
    otpStore.set(rideId, otpData);
    return { valid: true };
  }
  
  return { valid: false, reason: 'invalid' };
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
  // Driver arrived at pickup location
  socket.on('driverNearPickup', (data) => {
    const { rideId, userId } = data;
    
    // Generate OTP
    const otp = generateOtp(rideId);
    
    // Update ride status
    if (rides[rideId]) {
      rides[rideId].status = 'driver_arrived';
    }
    
    // Find rider's socket and send OTP
    const riderSocketId = connectedUsers[userId];
    if (riderSocketId) {
      io.to(riderSocketId).emit('rideOtpGenerated', { rideId, otp });
    }
    
    // Acknowledge receipt
    socket.emit('driverNearPickupAcknowledged', { rideId });
  });
  
  // Verify OTP
  socket.on('verifyOtp', (data) => {
    const { rideId, otp } = data;
    const result = verifyOtp(rideId, otp);
    
    // Send verification result
    socket.emit('otpVerificationResult', { 
      rideId, 
      success: result.valid,
      reason: result.reason
    });
    
    if (result.valid) {
      // Update ride status
      if (rides[rideId]) {
        rides[rideId].status = 'otp_verified';
      }
      
      // Notify both parties
      const ride = rides[rideId];
      if (ride) {
        const riderSocketId = connectedUsers[ride.userId];
        const captainSocketId = connectedCaptains[ride.captainId]?.socketId;
        
        if (riderSocketId) {
          io.to(riderSocketId).emit('otpVerified', { rideId });
        }
        
        if (captainSocketId) {
          io.to(captainSocketId).emit('otpVerified', { rideId });
        }
      }
    }
  });
  
  // Start ride
  socket.on('startRide', (data) => {
    const { rideId } = data;
    const otpData = otpStore.get(rideId);
    
    // Only allow if OTP was verified
    if (otpData && otpData.verified) {
      // Update ride status
      if (rides[rideId]) {
        rides[rideId].status = 'in_progress';
        rides[rideId].startedAt = Date.now();
      }
      
      // Notify both parties
      const ride = rides[rideId];
      if (ride) {
        const riderSocketId = connectedUsers[ride.userId];
        const captainSocketId = connectedCaptains[ride.captainId]?.socketId;
        
        const rideData = {
          rideId,
          startedAt: rides[rideId].startedAt
        };
        
        if (riderSocketId) {
          io.to(riderSocketId).emit('rideStarted', rideData);
        }
        
        if (captainSocketId) {
          io.to(captainSocketId).emit('rideStarted', rideData);
        }
      }
    } else {
      socket.emit('error', { message: 'Cannot start ride without OTP verification' });
    }
  });
  
  // Complete ride
  socket.on('completeRide', (data) => {
    const { rideId } = data;
    
    // Update ride status
    if (rides[rideId]) {
      rides[rideId].status = 'completed';
      rides[rideId].completedAt = Date.now();
      rides[rideId].duration = rides[rideId].startedAt 
        ? Date.now() - rides[rideId].startedAt 
        : 0;
    }
    
    // Clean up OTP data
    otpStore.delete(rideId);
    
    // Notify both parties
    const ride = rides[rideId];
    if (ride) {
      const riderSocketId = connectedUsers[ride.userId];
      const captainSocketId = connectedCaptains[ride.captainId]?.socketId;
      
      const rideData = {
        rideId,
        completedAt: rides[rideId].completedAt,
        duration: rides[rideId].duration
      };
      
      if (riderSocketId) {
        io.to(riderSocketId).emit('rideCompleted', rideData);
      }
      
      if (captainSocketId) {
        io.to(captainSocketId).emit('rideCompleted', rideData);
      }
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOtps, 5 * 60 * 1000);

module.exports = {
  setupOtpHandlers
};
// socket/index.js
const Captain = require('../models/captain.model');
const { 
  connectedUsers, 
  connectedCaptains, 
  rides, 
  otpStore, 
  pendingRideRequests 
} = require('./state');

const { setupOtpHandlers } = require('./handlers/otpHandlers');

// Utility functions for distance calculation
const toRadians = (deg) => deg * (Math.PI / 180);
const haversineDistance = (loc1, loc2) => {
  if (!loc1 || !loc2 || !loc1.lat || !loc2.lat || !loc1.lng || !loc2.lng) {
    throw new Error('Invalid location data for distance calculation');
  }
  const R = 6371; // Earth radius in km
  const dLat = toRadians(loc2.lat - loc1.lat);
  const dLon = toRadians(loc2.lng - loc1.lng);
  const lat1 = toRadians(loc1.lat);
  const lat2 = toRadians(loc2.lat);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function getEligibleCaptainsForRide(rideData, connectedCaptains) {
  return Object.entries(connectedCaptains).filter(([captainId, captainInfo]) => {
    if (captainInfo.isInRide) return false;
    if (rideData.rejectedBy && rideData.rejectedBy.includes(captainId)) return false;
    if (!captainInfo.location || !captainInfo.socketId) return false;
    return true;
  });
}

function findNearbyRides(captainId, captainLocation, specificRideId = null) {
  let ridesToCheck = specificRideId ? [[specificRideId, pendingRideRequests[specificRideId]]] : Object.entries(pendingRideRequests);
  for (const [rideId, rideData] of ridesToCheck) {
    if ((rideData.status === 'assigned' || rideData.status === 'pending_response') && rideData.captainId) continue;
    if (!rideData.pickupLocation || !rideData.pickupLocation.lat || !rideData.pickupLocation.lng) continue;
    let eligibleCaptains = getEligibleCaptainsForRide(rideData, connectedCaptains);
    if (captainId) {
      eligibleCaptains = eligibleCaptains.filter(([id]) => id === captainId);
    }
    let closest = null;
    let minDist = Infinity;
    eligibleCaptains.forEach(([id, info]) => {
      const dist = haversineDistance(info.location, rideData.pickupLocation);
      if (dist < minDist && dist <= 8) {
        minDist = dist;
        closest = { id, info, dist };
      }
    });
    if (closest) {
      rideData.status = 'pending_response';
      rideData.captainId = closest.id;
      if (!rideData.rejectedBy) rideData.rejectedBy = [];
      connectedCaptains[closest.id].isInRide = true;
      global.io.to(closest.info.socketId).emit('newRideRequest', {
        rideId,
        userId: rideData.userId,
        pickupLocation: rideData.pickupLocation,
        dropoffLocation: rideData.dropoffLocation,
        price: rideData.price,
        distance: rideData.distance,
        rideType: rideData.rideType
      });
      // Notify the user that a captain has been found
      const userSocketId = connectedUsers[rideData.userId];
      if (userSocketId) {
        global.io.to(userSocketId).emit('captainFound', {
          rideId,
          captainId: closest.id
        });
      }
      if (rideData.responseTimeout) clearTimeout(rideData.responseTimeout);
      rideData.responseTimeout = setTimeout(() => {
        if (pendingRideRequests[rideId] && pendingRideRequests[rideId].status === 'pending_response') {
          if (!pendingRideRequests[rideId].rejectedBy.includes(closest.id)) pendingRideRequests[rideId].rejectedBy.push(closest.id);
          connectedCaptains[closest.id].isInRide = false;
          rideData.status = 'unassigned';
          rideData.captainId = null;
          findNearbyRides(null, null, rideId);
        }
      }, 30000);
    }
  }
}

function generateRideId() {
  return Math.random().toString(36).substr(2, 9);
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Set up OTP handlers
    setupOtpHandlers(io, socket);

    // --- Register Captain ---
    socket.on('registerCaptain', (data) => {
      if (data && data.captainId) {
        console.log("🚗 Captain registered:", data.captainId);
        connectedCaptains[data.captainId] = {
          socketId: socket.id,
          location: data.location || null,
          isActive: data.isActive || true,
          isOnline: true,
          isInRide: false,
          lastUpdated: Date.now()
        };
        socket.userId = data.captainId;
        socket.role = 'captain';
        socket.join('captains');
        socket.emit('registrationAcknowledged', { success: true });
        // Only send pending ride requests that are still valid (pending_response and not timed out)
        Object.keys(pendingRideRequests).forEach(rideId => {
          const ride = pendingRideRequests[rideId];
          if (ride && ride.status === 'pending_response' && !ride.driverAccepted && ride.timeout) {
            socket.emit('newRideRequest', {
              rideId,
              userId: ride.userId,
              pickupLocation: ride.pickupLocation,
              dropoffLocation: ride.dropoffLocation,
              price: ride.price,
              distance: ride.distance,
              rideType: ride.rideType
            });
            // Do NOT reassign or change state here, just notify
          }
        });
        if (data.location) {
          Object.keys(pendingRideRequests).forEach(rideId => {
            const ride = pendingRideRequests[rideId];
            if (ride && ride.captainId === data.captainId && ride.status === 'pending_response' && !ride.driverAccepted && ride.timeout) {
              socket.emit('newRideRequest', {
                rideId,
                userId: ride.userId,
                pickupLocation: ride.pickupLocation,
                dropoffLocation: ride.dropoffLocation,
                price: ride.price,
                distance: ride.distance,
                rideType: ride.rideType
              });
            }
          });
        }
      } else {
        console.log('Invalid captain registration data:', data);
      }
    });

    // --- Register User ---
    socket.on('registerUser', (data) => {
      if (data && data.userId) {
        console.log("👤 User registered:", data.userId);
        connectedUsers[data.userId] = socket.id;
        socket.userId = data.userId;
        socket.role = 'user';
        socket.join('users');
      }
    });

    // --- Ride Request ---
    socket.on('requestRide', async (data, callback) => {
      if (!data || !data.userId || !data.pickupLocation || !data.dropoffLocation) {
        if (callback) {
          callback({ status: 'error', message: 'Missing required ride information' });
        }
        return;
      }
      try {
        const rideId = generateRideId();
        pendingRideRequests[rideId] = {
          rideId,
          userId: data.userId,
          rider: data.rider, // Add rider field
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          price: data.price,
          distance: data.distance,
          rideType: data.rideType,
          status: 'pending',
          requestTime: Date.now(),
          driverAccepted: false,
          timeout: null,
          
        };
        if (callback) {
          callback({ status: 'received', rideId });
        }
        // Set a 60s timeout for finding a driver
        pendingRideRequests[rideId].timeout = setTimeout(() => {
          if (
            pendingRideRequests[rideId] &&
            !pendingRideRequests[rideId].driverAccepted
          ) {
            const userSocketId = connectedUsers[data.userId];
            if (userSocketId) {
              io.to(userSocketId).emit('noDriversFound', { rideId });
            }
            delete pendingRideRequests[rideId];
            console.log(`[Ride Timeout] Ride ${rideId} deleted after 60s without driver acceptance.`);
          }
        }, 60000);
        // Find and notify nearby captains (existing logic)
        try {
          const activeCaptainsFromDB = await Captain.find({ isActive: true });
          if (!activeCaptainsFromDB || activeCaptainsFromDB.length === 0) {
            socket.emit('noCaptainsAvailable', { rideId });
            return;
          }
          const maxDistanceKm = 10;
          const nearbyCaptains = [];
          for (const captain of activeCaptainsFromDB) {
            const captainId = captain._id.toString();
            let captainLocation = null;
            let isConnectedViaSocket = false;
            if (connectedCaptains[captainId]) {
              isConnectedViaSocket = true;
              captainLocation = connectedCaptains[captainId].location;
            } else {
              captainLocation = captain.location;
            }
            if (connectedCaptains[captainId] && connectedCaptains[captainId].isInRide) {
              continue;
            }
            if (captainLocation && data.pickupLocation) {
              const dist = haversineDistance(captainLocation, data.pickupLocation);
              if (dist <= maxDistanceKm) {
                nearbyCaptains.push({ captainId, dist, isConnectedViaSocket });
              }
            }
          }
          if (nearbyCaptains.length === 0) {
            socket.emit('noCaptainsAvailable', { rideId });
            return;
          }
          nearbyCaptains.sort((a, b) => a.dist - b.dist);
          const assignedCaptain = nearbyCaptains[0];
          pendingRideRequests[rideId].status = 'pending_response';
          pendingRideRequests[rideId].captainId = assignedCaptain.captainId;
          if (!pendingRideRequests[rideId].rejectedBy) pendingRideRequests[rideId].rejectedBy = [];
          if (connectedCaptains[assignedCaptain.captainId]) {
            connectedCaptains[assignedCaptain.captainId].isInRide = true;
            io.to(connectedCaptains[assignedCaptain.captainId].socketId).emit('newRideRequest', {
              rideId,
              userId: data.userId,
              pickupLocation: data.pickupLocation,
              dropoffLocation: data.dropoffLocation,
              price: data.price,
              distance: data.distance,
              rideType: data.rideType
            });
          }
          // Notify the user that a captain has been found
          const userSocketId = connectedUsers[data.userId];
          if (userSocketId) {
            io.to(userSocketId).emit('captainFound', {
              rideId,
              captainId: assignedCaptain.captainId
            });
          }
          if (pendingRideRequests[rideId].responseTimeout) clearTimeout(pendingRideRequests[rideId].responseTimeout);
          pendingRideRequests[rideId].responseTimeout = setTimeout(() => {
            if (pendingRideRequests[rideId] && pendingRideRequests[rideId].status === 'pending_response') {
              if (!pendingRideRequests[rideId].rejectedBy.includes(assignedCaptain.captainId)) pendingRideRequests[rideId].rejectedBy.push(assignedCaptain.captainId);
              if (connectedCaptains[assignedCaptain.captainId]) connectedCaptains[assignedCaptain.captainId].isInRide = false;
              pendingRideRequests[rideId].status = 'unassigned';
              pendingRideRequests[rideId].captainId = null;
              findNearbyRides(null, null, rideId);
            }
          }, 30000);
        } catch (error) {
          socket.emit('rideRequestFailed', { rideId, message: 'Error finding nearby captains' });
        }
      } catch (error) {
        if (callback) {
          callback({ status: 'error', message: 'Server error processing request' });
        }
      }
    });

    // --- Ride Lifecycle ---
    socket.on('acceptRide', async (data) => {
      console.log("🚗 SERVER: ===== ACCEPT RIDE EVENT RECEIVED =====");
      console.log("🚗 SERVER: Data received:", JSON.stringify(data, null, 2));
      console.log("🚗 SERVER: Captain ID:", data.captainId);
      console.log("🚗 SERVER: User ID:", data.userId);
      console.log("🚗 SERVER: Ride ID:", data.rideId);
      
      try {
        const { rideId, captainId, userId } = data;
        
        // Update ride status
        if (rides[rideId]) {
          rides[rideId].status = 'accepted';
          rides[rideId].acceptedAt = new Date().toISOString();
          console.log("🚗 SERVER: Updated ride status to accepted");
        } else {
          console.log("❌ SERVER: Ride not found in rides object:", rideId);
        }
        
        // Remove from pending requests
        if (pendingRideRequests[rideId]) {
          delete pendingRideRequests[rideId];
          console.log("🚗 SERVER: Removed ride from pending requests");
        }
        
        // Find the user's socket
        console.log("🚗 SERVER: Looking for user socket with ID:", userId);
        
        // Emit to ALL connected sockets for debugging (remove this in production)
        io.emit('rideAccepted', {
          rideId,
          captainId,
          captainDetails: data.captainDetails || {},
          message: 'Your ride has been accepted!',
          acceptedAt: new Date().toISOString()
        });
        
        console.log("🎉 SERVER: Emitted 'rideAccepted' event to all clients");
        
        // Confirm to captain
        socket.emit('rideAcceptanceConfirmed', {
          rideId,
          message: 'Ride accepted successfully'
        });
        
        console.log("🚗 SERVER: Sent confirmation to captain");
        
      } catch (error) {
        console.error("❌ SERVER: Error accepting ride:", error);
        socket.emit('error', { message: 'Failed to accept ride' });
      }
    });

    // --- Ride Cancellation ---
    socket.on('cancelRide', (data) => {
      const { rideId } = data;
      const ride = pendingRideRequests[rideId];
      if (!ride) return;
      if (socket.role === 'captain') {
        // Captain cancels
        ride.status = 'cancelledByCaptain';
        const userSocketId = connectedUsers[ride.userId];
        if (userSocketId) {
          io.to(userSocketId).emit('rideCancelledByCaptain', { rideId });
        }
        if (ride.timeout) clearTimeout(ride.timeout);
        if (ride.responseTimeout) clearTimeout(ride.responseTimeout);
        connectedCaptains[socket.userId].isInRide = false;
        delete pendingRideRequests[rideId];
      } else if (socket.role === 'user') {
        // Rider cancels
        ride.status = 'cancelledByUser';
        const captainId = ride.captainId;
        if (captainId && connectedCaptains[captainId]) {
          io.to(connectedCaptains[captainId].socketId).emit('rideCancelledByUser', { rideId });
        }
        if (ride.timeout) clearTimeout(ride.timeout);
        if (ride.responseTimeout) clearTimeout(ride.responseTimeout);
        if (captainId && connectedCaptains[captainId]) connectedCaptains[captainId].isInRide = false;
        delete pendingRideRequests[rideId];
      }
    });

    // --- Location Updates ---
    // In socket/index.js
    socket.on('updateCaptainLocation', (data) => {
      if (!data || typeof data !== 'object') return;

      const { lat, lng } = data;
      const isValidLocation =
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;

      if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
        if (isValidLocation) {
          // Store location with consistent naming
          connectedCaptains[socket.userId].location = {
            lat,
            lng, // Use lng consistently
            lastUpdate: Date.now()
          };

          // Update active rides
          try {
            const activeRides = Object.values(rides || {}).filter(
              ride => ride.captainId === socket.userId
            );
            activeRides.forEach(ride => {
              if (ride.userId) {
                socket.to(ride.userId).emit('captainLocationUpdate', {
                  captainId: socket.userId,
                  location: { lat, lon: lng } // Convert to expected format for client
                });
              }
            });
          } catch (error) {
            console.error('Error updating ride locations:', error);
          }
        }
      }
    });

    socket.on('locationUpdate', (data) => {
      if (!data || !data.rideId || typeof data.lat !== 'number' || typeof data.lng !== 'number' || !data.role) {
        return;
      }
      const ride = pendingRideRequests[data.rideId];
      if (!ride || !ride.userId || !ride.captainId) {
        return;
      }
      let counterpartySocketId = null;
      if (data.role === 'user') {
        const captainObj = connectedCaptains[ride.captainId];
        if (captainObj && captainObj.socketId) {
          counterpartySocketId = captainObj.socketId;
        }
      } else if (data.role === 'captain') {
        counterpartySocketId = connectedUsers[ride.userId];
      }
      if (counterpartySocketId) {
        io.to(counterpartySocketId).emit('counterpartyLocation', {
          rideId: data.rideId,
          role: data.role,
          lat: data.lat,
          lng: data.lng
        });
      }
    });

    // --- Ride Lifecycle ---
    socket.on('rejectRide', async (data) => {
      console.log("❌ SERVER: ===== REJECT RIDE EVENT RECEIVED =====");
      console.log("❌ SERVER: Data received:", JSON.stringify(data, null, 2));
      
      try {
        const { rideId, captainId, userId } = data;
        
        // Emit to ALL connected sockets for debugging (remove this in production)
        io.emit('rideRejected', {
          rideId,
          captainId,
          message: 'Driver rejected your ride. Finding another driver...'
        });
        
        console.log("❌ SERVER: Emitted 'rideRejected' event to all clients");
        
      } catch (error) {
        console.error("❌ SERVER: Error rejecting ride:", error);
      }
    });

    socket.on('cancelRide', (data) => {
      if (!data || !data.rideId) {
        return;
      }
      const ride = rides[data.rideId];
      if (!ride) {
        return;
      }
      if (data.cancelledBy === 'captain' && ride.userId) {
        const userSocketId = connectedUsers[ride.userId];
        if (userSocketId) {
          io.to(userSocketId).emit('rideCancelled', {
            rideId: data.rideId,
            captainId: data.captainId,
            cancelledBy: 'captain',
            reason: data.reason || 'Cancelled by captain',
            cancelTime: data.cancelTime || new Date().toISOString()
          });
        }
      } else if (data.cancelledBy === 'user' && ride.captainId) {
        const captainSocketId = connectedCaptains[ride.captainId]?.socketId;
        if (captainSocketId) {
          io.to(captainSocketId).emit('rideCancelled', {
            rideId: data.rideId,
            userId: ride.userId,
            cancelledBy: 'user',
            reason: data.reason || 'Cancelled by user',
            cancelTime: data.cancelTime || new Date().toISOString()
          });
        }
      }
      delete rides[data.rideId];
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      if (socket.role === 'captain' && socket.userId) {
        if (connectedCaptains[socket.userId]) {
          connectedCaptains[socket.userId].isOnline = false;
          connectedCaptains[socket.userId].lastSeen = Date.now();
        }
      }
      if (socket.role === 'user' && socket.userId) {
        delete connectedUsers[socket.userId];
      }
    });

    socket.on("rideCancelled", (data) => {
      console.log("Ride cancelled by rider");
      // Broadcast to the driver
      socket.broadcast.emit("rideCancelled", data);
    });
  });
}

module.exports = setupSocket;

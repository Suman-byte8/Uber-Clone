const { connectedUsers, connectedCaptains, pendingRideRequests } = require('../state');

// Track cancellation windows
const cancellationWindows = {}; // { rideId: { timeoutId, expiresAt } }

// Function to setup cancellation window
function setupCancellationWindow(io, rideId, userId, captainId) {
  // Clear any existing cancellation window
  if (cancellationWindows[rideId] && cancellationWindows[rideId].timeoutId) {
    clearTimeout(cancellationWindows[rideId].timeoutId);
  }
  
  const expiresAt = Date.now() + 10000; // 10 seconds from now
  
  // Set up the cancellation window
  cancellationWindows[rideId] = {
    expiresAt,
    timeoutId: setTimeout(() => {
      // After 10 seconds, remove the cancellation window
      if (cancellationWindows[rideId]) {
        delete cancellationWindows[rideId];
      }
      
      // Notify both parties that cancellation window has expired
      if (connectedUsers[userId]) {
        io.to(connectedUsers[userId]).emit('cancellationWindowExpired', { rideId });
      }
      
      if (connectedCaptains[captainId] && connectedCaptains[captainId].socketId) {
        io.to(connectedCaptains[captainId].socketId).emit('cancellationWindowExpired', { rideId });
      }
    }, 10000)
  };
  
  return expiresAt;
}

// Handle ride acceptance
function handleRideAccepted(socket, io, data) {
  const { rideId, captainId } = data;
  
  if (!pendingRideRequests[rideId]) {
    socket.emit('error', { message: 'Ride request not found' });
    return;
  }
  
  const rideData = pendingRideRequests[rideId];
  rideData.status = 'accepted';
  rideData.captainId = captainId;
  
  // Setup the 10-second cancellation window
  const cancellationExpiresAt = setupCancellationWindow(io, rideId, rideData.userId, captainId);
  
  // Notify both parties to start the cancellation timer
  io.to(rideData.userId).emit('startCancellationTimer', { rideId, expiresAt: cancellationExpiresAt });
  io.to(captainId).emit('startCancellationTimer', { rideId, expiresAt: cancellationExpiresAt });
  
  // Notify the user that their ride was accepted
  if (connectedUsers[rideData.userId]) {
    io.to(connectedUsers[rideData.userId]).emit('rideAccepted', {
      rideId,
      captainId,
      captainDetails: connectedCaptains[captainId],
      cancellationWindowExpiresAt: cancellationExpiresAt
    });
  }
  
  // Confirm to the captain that they've accepted the ride
  socket.emit('rideAcceptanceConfirmed', {
    rideId,
    rideDetails: rideData,
    cancellationWindowExpiresAt: cancellationExpiresAt
  });
}

// Handle ride cancellation
function handleRideCancel(socket, io, data) {
  const { rideId, cancelledBy } = data;

  console.log(`${cancelledBy} cancelled the ride`);

  // Notify the rider and driver about the cancellation
  const ride = pendingRideRequests[rideId];
  if (ride) {
    if (connectedUsers[ride.userId]) {
      io.to(connectedUsers[ride.userId]).emit("rideCancelled", {
        rideId,
        cancelledBy,
      });
    }
    if (connectedCaptains[ride.captainId]?.socketId) {
      io.to(connectedCaptains[ride.captainId].socketId).emit("rideCancelled", {
        rideId,
        cancelledBy,
      });
    }
  }
}

// Check cancellation window status
function checkCancellationWindow(socket, data) {
  const { rideId } = data;
  
  if (!cancellationWindows[rideId]) {
    socket.emit('cancellationWindowStatus', {
      rideId,
      active: false,
      message: 'No active cancellation window'
    });
    return;
  }
  
  const timeRemaining = Math.max(0, Math.floor((cancellationWindows[rideId].expiresAt - Date.now()) / 1000));
  
  socket.emit('cancellationWindowStatus', {
    rideId,
    active: timeRemaining > 0,
    timeRemaining,
    expiresAt: cancellationWindows[rideId].expiresAt
  });
}

module.exports = {
  handleRideAccepted,
  handleRideCancel,
  checkCancellationWindow
};
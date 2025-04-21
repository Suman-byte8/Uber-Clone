const express = require('express');
const dotenv = require('dotenv');
const { verifyToken } = require('./services/JWToken');
const connectDB = require('./database/db');
dotenv.config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

const http = require('http')
const {Server} = require('socket.io')


const userRoutes = require('./routes/user.route');
const captainRoutes = require('./routes/captain.route');

const otpRoutes = require('./routes/otp.route');
const locationRoutes = require('./routes/location.route');
app.use(cors());

app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// socket.IO logic
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  // Verify the token (using jwt.verify or your auth logic)
  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.id; // Attach user ID (or captain ID) to the socket
    socket.role = decoded.role;     // Attach role
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error("Authentication error: Invalid token"));
  }
});
// Store connected users/captains (in memory for simplicity, consider Redis for production)
const connectedUsers = {}; // { userId: socketId }
const connectedCaptains = {}; // { captainId: { socketId: socket.id, location: { lat, lng }, isOnline: true/false } }
const activeCaptains = []; // Array of active captain IDs

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

// Add findNearbyRides function to match captains with pending ride requests
const pendingRideRequests = {};

function findNearbyRides(captainId, captainLocation) {
  if (!captainId || !captainLocation || !captainLocation.lat || !captainLocation.lng) {
    console.log('Invalid captain data for ride matching');
    return;
  }

  console.log(`Finding nearby rides for captain ${captainId} at location:`, captainLocation);
  
  // Skip if no pending ride requests
  if (Object.keys(pendingRideRequests).length === 0) {
    return;
  }

  // Calculate distance to each pending ride
  const captainMatches = [];
  
  for (const [rideId, rideData] of Object.entries(pendingRideRequests)) {
    try {
      const pickupLocation = rideData.pickupLocation;
      
      if (!pickupLocation || !pickupLocation.lat || !pickupLocation.lng) {
        console.log(`Skipping ride ${rideId} due to invalid pickup location`);
        continue;
      }
      
      const distance = haversineDistance(captainLocation, pickupLocation);
      console.log(`Distance from captain ${captainId} to ride ${rideId}: ${distance.toFixed(2)} km`);
      
      if (distance <= 8) { // 8 km radius
        captainMatches.push({
          rideId,
          distance,
          rideData
        });
      }
    } catch (error) {
      console.error(`Error calculating distance for ride ${rideId}:`, error);
    }
  }
  
  // Sort matches by distance (closest first)
  captainMatches.sort((a, b) => a.distance - b.distance);
  
  // Try to match with the closest ride
  if (captainMatches.length > 0) {
    const closestMatch = captainMatches[0];
    const { rideId, rideData } = closestMatch;
    
    console.log(`Matching captain ${captainId} with ride ${rideId} (${closestMatch.distance.toFixed(2)} km away)`);
    
    // Check if captain is already in a ride
    const captainInfo = connectedCaptains[captainId];
    if (captainInfo && captainInfo.isInRide) {
      console.log(`Captain ${captainId} is already in a ride, skipping match`);
      return;
    }
    
    // Mark the captain as matched
    if (connectedCaptains[captainId]) {
      connectedCaptains[captainId].isInRide = true;
    }
    
    // Emit ride request to captain
    const captainSocketId = connectedCaptains[captainId]?.socketId;
    if (captainSocketId) {
      io.to(captainSocketId).emit('newRideRequest', {
        rideId,
        userId: rideData.userId,
        pickupLocation: rideData.pickupLocation,
        dropoffLocation: rideData.dropoffLocation,
        price: rideData.price,
        distance: rideData.distance,
        rideType: rideData.rideType
      });
      
      console.log(`Sent ride request to captain ${captainId} (socket: ${captainSocketId})`);
      
      // Remove from pending requests
      delete pendingRideRequests[rideId];
    } else {
      console.log(`Captain ${captainId} is not connected via socket`);
    }
  } else {
    console.log(`No matching rides found for captain ${captainId}`);
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, Role: ${socket.role}, ID: ${socket.userId}`);

  // Log current connected users and captains count and their IDs
  console.log('Currently connected users:', Object.keys(connectedUsers));
  console.log('Currently connected captains:', Object.keys(connectedCaptains));

  // --- Register User/Captain ---
  if (socket.role === 'captain') {
    connectedCaptains[socket.userId] = { socketId: socket.id, isOnline: true, location: null };
    console.log('Captain registered:', socket.userId, 'Socket ID:', socket.id);
    // Force captain to online on connection
    connectedCaptains[socket.userId].isOnline = true;
    // Optionally join a 'captains' room
    socket.join('captains');
    // Prompt captain to send location immediately after connecting
    socket.emit('requestLocationUpdate');
  } else if (socket.role === 'user') {
    connectedUsers[socket.userId] = socket.id;
    console.log('User registered:', socket.userId, 'Socket ID:', socket.id);
    // Optionally join a 'users' room
     socket.join('users');
  }

  // --- Captain Events ---
  socket.on('registerCaptain', (data) => {
    if (data && data.captainId) {
      console.log(`Captain ${data.captainId} registered`);
      
      // Store captain socket info
      connectedCaptains[data.captainId] = socket.id;
      
      // Set socket properties
      socket.userId = data.captainId;
      socket.role = 'captain';
      
      // Store captain connection info with socketId for direct messaging
      connectedCaptains[data.captainId] = {
        socketId: socket.id,
        location: data.location || null,
        isActive: data.isActive || true,
        isInRide: false,
        lastUpdated: Date.now()
      };
      
      // Add to active captains array if not already there
      if (!activeCaptains.includes(data.captainId)) {
        activeCaptains.push(data.captainId);
      }
      
      socket.join('captains');
      
      // Acknowledge registration
      socket.emit('registrationAcknowledged', { success: true });
      
      // Check for pending rides that might match this captain
      if (data.location) {
        console.log(`Checking for pending rides for captain ${data.captainId}`);
        
        // Find pending rides assigned to this captain
        Object.keys(pendingRideRequests).forEach(rideId => {
          const ride = pendingRideRequests[rideId];
          
          if (ride && ride.captainId === data.captainId) {
            console.log(`Found pending ride ${rideId} for captain ${data.captainId}`);
            
            // Send ride request to captain
            socket.emit('newRideRequest', {
              rideId,
              userId: ride.userId,
              pickupLocation: ride.pickupLocation,
              dropoffLocation: ride.dropoffLocation,
              price: ride.price,
              distance: ride.distance,
              rideType: ride.rideType
            });
            
            console.log(`Sent pending ride request ${rideId} to captain ${data.captainId}`);
          }
        });
      }
    } else {
      console.log('Invalid captain registration data:', data);
    }
  });

  socket.on('updateCaptainLocation', (data) => {
    // Strict validation of location data
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid location update from captain ${socket.userId}: Data is not an object`);
      return;
    }

    // Validate latitude and longitude
    const { lat, lng } = data;
    const isValidLocation = 
      typeof lat === 'number' && 
      typeof lng === 'number' && 
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180;

    if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
      if (isValidLocation) {
        // Update captain's location in memory
        connectedCaptains[socket.userId].location = { lat, lng };
        connectedCaptains[socket.userId].isOnline = true;
        connectedCaptains[socket.userId].lastLocationUpdate = Date.now();

        console.log(`✅ Captain ${socket.userId} location updated:`, { lat, lng });

        // Broadcast location to active ride participants
        try {
          // Find active rides for this captain
          const activeRides = Object.values(rides || {}).filter(
            ride => ride.captainId === socket.userId
          );

          activeRides.forEach(ride => {
            if (ride.userId) {
              socket.to(ride.userId).emit('captainLocationUpdate', {
                captainId: socket.userId,
                location: { lat, lng }
              });
            }
          });
        } catch (error) {
          console.error('Error broadcasting captain location:', error);
        }

        // Optional: Trigger nearby ride matching
        try {
          if (typeof findNearbyRides === 'function') {
            findNearbyRides(socket.userId, { lat, lng });
          }
        } catch (error) {
          console.error('Error finding nearby rides:', error);
        }
      } else {
        console.warn(`❌ Invalid location data from captain ${socket.userId}:`, data);
      }
    } else {
      console.warn(`❌ Location update from unauthorized source: ${socket.userId}`);
      console.log(`Received location update from unauthorized or unknown captain: ${socket.userId}`);
    }
  });

  socket.on('captainStatusUpdate', (data) => {
     // data: { isOnline: true/false }
     if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
        connectedCaptains[socket.userId].isOnline = data.isOnline;
        console.log(`Captain ${socket.userId} status: ${data.isOnline ? 'Online' : 'Offline'}`);
        // TODO: Potentially notify relevant systems or users
     } else {
       console.log(`Received status update from unauthorized or unknown captain: ${socket.userId}`);
     }
  });

  // --- User Events ---
  const rides = {}; // In-memory store for rides: rideId -> { userId, pickupLocation, dropoffLocation, status, captainId }

  const generateRideId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const Captain = require('./models/captain.model');

  socket.on('requestRide', async (data, callback) => {
    console.log(`Ride request received:`, data);
    
    // Basic validation
    if (!data || !data.userId || !data.pickupLocation || !data.dropoffLocation) {
      console.log('Invalid ride request data:', data);
      if (callback) {
        callback({ status: 'error', message: 'Missing required ride information' });
      }
      return;
    }

    try {
      // Generate a unique ride ID
      const rideId = generateRideId();
      
      console.log(`Processing ride request ${rideId} from user ${data.userId}`);
      
      // Store the ride request in pending requests
      pendingRideRequests[rideId] = {
        rideId,
        userId: data.userId,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        price: data.price,
        distance: data.distance,
        rideType: data.rideType,
        status: 'pending',
        requestTime: Date.now()
      };
      
      // Acknowledge receipt of the request
      if (callback) {
        callback({ status: 'received', rideId });
      }
      
      // Find nearby captains
      try {
        // Get active captains from database
        const activeCaptainsFromDB = await Captain.find({ isActive: true });
        
        if (!activeCaptainsFromDB || activeCaptainsFromDB.length === 0) {
          console.log('No active captains found in database');
          socket.emit('noCaptainsAvailable', { rideId });
          return;
        }
        
        console.log(`Found ${activeCaptainsFromDB.length} active captains in database`);
        
        // Find nearby captains based on location
        const maxDistanceKm = 10; // Maximum distance in kilometers
        const nearbyCaptains = [];
        
        for (const captain of activeCaptainsFromDB) {
          const captainId = captain._id.toString();
          let captainLocation = null;
          let isConnectedViaSocket = false;
          
          // Check if captain is connected via socket
          if (connectedCaptains[captainId]) {
            isConnectedViaSocket = true;
            captainLocation = connectedCaptains[captainId].location;
          } else {
            // Use the location from the database
            captainLocation = captain.location;
          }
          
          // Skip captains who are in a ride
          if (connectedCaptains[captainId] && connectedCaptains[captainId].isInRide) {
            console.log(`Captain ${captainId} is already in a ride, skipping`);
            continue;
          }
          
          // Calculate distance
          if (captainLocation) {
            try {
              const distance = haversineDistance(data.pickupLocation, captainLocation);
              console.log(`Distance to captain ${captainId}: ${distance.toFixed(2)} km`);
              
              if (distance <= maxDistanceKm) {
                nearbyCaptains.push({
                  captainId,
                  distance,
                  location: captainLocation,
                  socketId: connectedCaptains[captainId]?.socketId,
                  isConnectedViaSocket
                });
              }
            } catch (error) {
              console.error(`Error calculating distance for captain ${captainId}:`, error);
              console.error('Error details:', {
                pickupLocation: data.pickupLocation,
                captainLocation
              });
            }
          }
        }
        
        console.log(`Found ${nearbyCaptains.length} nearby captains`);
        
        // If no nearby captains with socket connections, use any active captain
        if (nearbyCaptains.length === 0) {
          console.log('No nearby captains found');
          socket.emit('noCaptainsAvailable', { rideId });
          return;
        }
        
        // Sort captains by connection status first, then by distance
        nearbyCaptains.sort((a, b) => {
          // Connected captains first
          if (a.isConnectedViaSocket && !b.isConnectedViaSocket) return -1;
          if (!a.isConnectedViaSocket && b.isConnectedViaSocket) return 1;
          // Then by distance
          return a.distance - b.distance;
        });
        
        // Try to match with the best captain
        const bestCaptain = nearbyCaptains[0];
        console.log(`Best captain match: ${bestCaptain.captainId} (${bestCaptain.distance.toFixed(2)} km away, connected: ${bestCaptain.isConnectedViaSocket})`);
        
        // Store the ride in active rides
        pendingRideRequests[rideId] = {
          ...pendingRideRequests[rideId],
          captainId: bestCaptain.captainId,
          status: bestCaptain.isConnectedViaSocket ? 'pending' : 'assigned'
        };
        
        // Check if captain is connected via socket
        if (bestCaptain.socketId) {
          // Mark the captain as in a ride
          if (connectedCaptains[bestCaptain.captainId]) {
            connectedCaptains[bestCaptain.captainId].isInRide = true;
          }
          
          // Send ride request to captain
          io.to(bestCaptain.socketId).emit('newRideRequest', {
            rideId,
            userId: data.userId,
            pickupLocation: data.pickupLocation,
            dropoffLocation: data.dropoffLocation,
            price: data.price,
            distance: data.distance,
            rideType: data.rideType
          });
          
          console.log(`Sent ride request to captain ${bestCaptain.captainId}`);
        } else {
          // Captain is not connected via socket, store in pending requests
          console.log(`Captain ${bestCaptain.captainId} is not connected via socket. Storing in pending requests.`);
        }
        
        // Notify user that a captain has been found
        socket.emit('captainFound', {
          rideId,
          captainId: bestCaptain.captainId,
          estimatedArrival: Math.ceil(bestCaptain.distance * 2) // Rough estimate: 2 minutes per km
        });
      } catch (error) {
        console.error('Error finding nearby captains:', error);
        socket.emit('rideRequestFailed', { 
          rideId, 
          message: 'Error finding nearby captains' 
        });
      }
    } catch (error) {
      console.error('Error processing ride request:', error);
      if (callback) {
        callback({ status: 'error', message: 'Server error processing request' });
      }
    }
  });

  // --- Ride Lifecycle Events ---
  socket.on('acceptRide', (data) => {
    if (socket.role === 'captain') {
      console.log(`Captain ${socket.userId} accepted ride ${data.rideId}`);

      const ride = rides[data.rideId];
      if (!ride) {
        socket.emit('acceptRideResponse', { status: 'error', message: 'Ride not found' });
        return;
      }

      if (ride.status !== 'requested') {
        socket.emit('acceptRideResponse', { status: 'error', message: 'Ride already accepted or completed' });
        return;
      }

      // Update ride status and assign captain
      ride.status = 'accepted';
      ride.captainId = socket.userId;

      // Notify the user who requested the ride
      const userSocketId = connectedUsers[ride.userId];
      if (userSocketId) {
        const captainDetails = {
          id: socket.userId,
          // Add more captain details as needed, e.g., name, vehicle, rating
        };
        io.to(userSocketId).emit('rideAccepted', { rideId: data.rideId, captainDetails });
      }

      // Optionally join ride room
      socket.join(`ride_${data.rideId}`);

      // Acknowledge to captain
      socket.emit('acceptRideResponse', { status: 'success', rideId: data.rideId });
    }
  });

  socket.on('rejectRide', (data) => {
    if (!data || !data.rideId || !data.captainId) {
      console.log('Invalid ride rejection data:', data);
      return;
    }

    console.log(`Captain ${data.captainId} rejected ride ${data.rideId}`);
    
    // Remove this captain from the potential matches for this ride
    if (pendingRideRequests[data.rideId]) {
      // Mark this captain as having rejected this ride
      if (!pendingRideRequests[data.rideId].rejectedBy) {
        pendingRideRequests[data.rideId].rejectedBy = [];
      }
      pendingRideRequests[data.rideId].rejectedBy.push(data.captainId);
      
      // Try to find another captain for this ride
      if (pendingRideRequests[data.rideId].userId && connectedCaptains[data.captainId]) {
        // Get the user's socket
        const userSocketId = connectedUsers[pendingRideRequests[data.rideId].userId];
        
        if (userSocketId) {
          // Inform the user that we're still looking for a captain
          io.to(userSocketId).emit('captainSearching', {
            rideId: data.rideId,
            message: 'Looking for another captain...'
          });
        }
        
        // Try to find another nearby captain
        setTimeout(() => {
          // Only search if the ride is still pending
          if (pendingRideRequests[data.rideId]) {
            findNearbyRides(null, pendingRideRequests[data.rideId].pickupLocation, data.rideId);
          }
        }, 1000);
      }
    }
  });

  socket.on('cancelRide', (data) => {
    if (!data || !data.rideId) {
      console.log('Invalid ride cancellation data:', data);
      return;
    }

    console.log(`Ride ${data.rideId} cancelled by ${data.cancelledBy}`);
    
    // Get the ride details
    const ride = rides[data.rideId];
    
    if (!ride) {
      console.log(`Ride ${data.rideId} not found in pending or active rides`);
      return;
    }
    
    // Notify the user if cancelled by captain
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
    }
    
    // Notify the captain if cancelled by user
    if (data.cancelledBy === 'user' && ride.captainId) {
      const captainSocketId = connectedCaptains[ride.captainId]?.socketId;
      if (captainSocketId) {
        io.to(captainSocketId).emit('rideCancelled', {
          rideId: data.rideId,
          userId: data.userId,
          cancelledBy: 'user',
          reason: data.reason || 'Cancelled by user',
          cancelTime: data.cancelTime || new Date().toISOString()
        });
      }
    }
    
    // Remove the ride from pending and active rides
    if (pendingRideRequests[data.rideId]) {
      delete pendingRideRequests[data.rideId];
    }
    
    if (rides[data.rideId]) {
      delete rides[data.rideId];
    }
    
    // Update the ride status in the database (if implemented)
    // This would typically be done by calling a function to update the ride status in MongoDB
  });
  
  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // If this was a captain, update their status
    if (socket.role === 'captain' && socket.userId) {
      if (connectedCaptains[socket.userId]) {
        // Don't delete the captain entry, just mark as offline
        connectedCaptains[socket.userId].isOnline = false;
        connectedCaptains[socket.userId].lastSeen = Date.now();
        console.log(`Captain ${socket.userId} marked as offline`);
      }
    }
    
    // If this was a user, remove from connected users
    if (socket.role === 'user' && socket.userId) {
      delete connectedUsers[socket.userId];
      console.log(`User ${socket.userId} removed from connected users`);
    }
    // TODO: Handle disconnects during active rides (notify other party)
  });
});

app.get('/', (req, res) => {
  res.send("Hello World");
})

connectDB()

app.use('/api/user', userRoutes)
app.use('/api/captain',captainRoutes)

app.use('/api/otp', otpRoutes);

app.use('/api/locations', locationRoutes);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

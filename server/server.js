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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, Role: ${socket.role}, ID: ${socket.userId}`);

  // Log current connected users and captains count and their IDs
  console.log('Currently connected users:', Object.keys(connectedUsers));
  console.log('Currently connected captains:', Object.keys(connectedCaptains));

  // --- Register User/Captain ---
  if (socket.role === 'captain') {
    connectedCaptains[socket.userId] = { socketId: socket.id, isOnline: true, location: null };
    console.log('Captain registered:', socket.userId);
    // Optionally join a 'captains' room
    socket.join('captains');
  } else if (socket.role === 'user') {
    connectedUsers[socket.userId] = socket.id;
    console.log('User registered:', socket.userId);
    // Optionally join a 'users' room
     socket.join('users');
  }

  // --- Captain Events ---
  socket.on('updateCaptainLocation', (data) => {
    // data should contain { lat, lng }
    if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
      connectedCaptains[socket.userId].location = data;
      console.log(`Captain ${socket.userId} location updated:`, data);

      // TODO: Broadcast location to relevant users (e.g., user in an active ride with this captain)
      // Example: If captain is on a trip, emit to the user in that trip's room
      // io.to(`ride_${rideId}`).emit('captainLocationUpdate', { captainId: socket.userId, location: data });

      // Optional: Persist location to DB periodically if needed (less frequently than socket emits)
    }
  });

  socket.on('captainStatusUpdate', (data) => {
     // data: { isOnline: true/false }
     if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
        connectedCaptains[socket.userId].isOnline = data.isOnline;
        console.log(`Captain ${socket.userId} status: ${data.isOnline ? 'Online' : 'Offline'}`);
        // TODO: Potentially notify relevant systems or users
     }
  });

  // --- User Events ---
  const rides = {}; // In-memory store for rides: rideId -> { userId, pickupLocation, dropoffLocation, status, captainId }

  const generateRideId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const Captain = require('./models/captain.model');

  socket.on('requestRide', async (data) => {
    if (socket.role === 'user') {
      console.log(`Ride request from user ${socket.userId}:`, data);

      // Find active captains from DB
      let activeCaptains;
      try {
        activeCaptains = await Captain.find({ isActive: true }).select('_id location');
        console.log(`Active captains fetched from DB: ${activeCaptains.length}`);
      } catch (err) {
        console.error('Error fetching active captains from DB:', err);
        socket.emit('noCaptainsAvailable', { rideId: null });
        return;
      }

      const nearbyCaptains = [];
      const maxDistanceKm = 5; // Define max distance to consider nearby

      const toRadians = (deg) => deg * (Math.PI / 180);
      const haversineDistance = (loc1, loc2) => {
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

      console.log('Pickup location received:', data.pickupLocation);

      for (const captain of activeCaptains) {
        const captainId = captain._id.toString();
        const info = connectedCaptains[captainId];
        let captainLocation = null;
        if (info && info.location) {
          captainLocation = info.location;
          console.log(`Captain ${captainId} location from socket:`, captainLocation);
        } else if (captain.location) {
          captainLocation = { lat: captain.location.coordinates[1], lng: captain.location.coordinates[0] };
          console.log(`Captain ${captainId} location from DB:`, captainLocation);
        } else {
          console.log(`Captain ${captainId} location unknown`);
        }

        if (captainLocation) {
          const distance = haversineDistance(data.pickupLocation, captainLocation);
          console.log(`Distance to captain ${captainId}: ${distance} km`);
          if (distance <= maxDistanceKm) {
            if (info && info.socketId) {
              nearbyCaptains.push({ captainId, socketId: info.socketId });
            } else {
              console.log(`Captain ${captainId} not connected via socket, cannot notify`);
            }
          }
        }
      }

      console.log(`Nearby captains found: ${nearbyCaptains.length}`);

      if (nearbyCaptains.length === 0) {
        // Notify user no captains available
        socket.emit('noCaptainsAvailable', { rideId: null });
        return;
      }

      const rideId = generateRideId();
      rides[rideId] = {
        userId: socket.userId,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        status: 'requested',
        captainId: null,
      };

      // Emit newRideRequest to nearby captains
      nearbyCaptains.forEach(({ captainId, socketId }) => {
        io.to(socketId).emit('newRideRequest', { rideDetails: data, rideId });
      });

      // Acknowledge to user
      socket.emit('requestRide', { status: 'received', rideId });
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
    // data: { rideId, captainId }
     if (socket.role === 'captain') {
        console.log(`Captain ${socket.userId} rejected ride ${data.rideId}`);
        // TODO:
        // 1. Potentially try finding another captain
        // 2. Or notify the user that the request was rejected (maybe after a timeout or all captains reject)
        // const userSocketId = findUserSocketIdByRideId(data.rideId);
        // if (userSocketId) {
        //    io.to(userSocketId).emit('rideRejected', { rideId: data.rideId, captainId: socket.userId });
        // }
     }
   });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.role === 'captain' && connectedCaptains[socket.userId]) {
      // Mark as offline or remove, depending on logic
      connectedCaptains[socket.userId].isOnline = false;
      console.log(`Captain ${socket.userId} marked as offline due to disconnect.`);
      // Optionally delete connectedCaptains[socket.userId];
    } else if (socket.role === 'user' && connectedUsers[socket.userId]) {
      delete connectedUsers[socket.userId];
       console.log(`User ${socket.userId} removed.`);
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

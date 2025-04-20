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
  socket.on('requestRide', (data) => {
    // data: { userId, pickupLocation, destinationLocation, etc. }
    if (socket.role === 'user') {
       console.log(`Ride request from user ${socket.userId}:`, data);
       // TODO: Find nearby available captains
       // 1. Filter `connectedCaptains` for `isOnline === true` and proximity to `pickupLocation`
       // 2. Emit 'newRideRequest' to each suitable captain's socketId
       // io.to(captainSocketId).emit('newRideRequest', { rideDetails: data, rideId: newRideId });
    }
  });

  // --- Ride Lifecycle Events ---
  socket.on('acceptRide', (data) => {
    // data: { rideId, captainId }
    if (socket.role === 'captain') {
      console.log(`Captain ${socket.userId} accepted ride ${data.rideId}`);
      // TODO:
      // 1. Update ride status in DB
      // 2. Notify the specific user who requested the ride
      // const userSocketId = findUserSocketIdByRideId(data.rideId); // Need logic to map rideId to userId/socketId
      // if (userSocketId) {
      //   io.to(userSocketId).emit('rideAccepted', { rideId: data.rideId, captainDetails: getCaptainDetails(socket.userId) });
      //   // Maybe create a room for this specific ride
      //   const userSocket = io.sockets.sockets.get(userSocketId);
      //   if (userSocket) socket.join(`ride_${data.rideId}`);
      //   socket.join(`ride_${data.rideId}`);
      // }
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

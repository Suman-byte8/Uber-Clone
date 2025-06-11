const express = require('express');
const dotenv = require('dotenv');
const { verifyToken } = require('./services/JWToken');
const connectDB = require('./database/db');
dotenv.config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

const http = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/user.route');
const captainRoutes = require('./routes/captain.route');
const otpRoutes = require('./routes/otp.route');
const locationRoutes = require('./routes/location.route');
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://uber-clone-client.netlify.app/','http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const authHeader = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization;
                    
  if (!authHeader) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Clean the token string
    const token = authHeader.replace('Bearer ', '').trim();
    
    // Add debug logging
    console.log('Received token:', token);
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Token verification failed');
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user info to socket
    socket.userId = decoded.id;
    socket.role = decoded.role;
    next();
  } catch (err) {
    console.error('Socket authentication error details:', {
      error: err.message,
      token: authHeader
    });
    return next(new Error('Authentication error: Invalid token'));
  }
});

// ======= ROUTES =======
app.use('/api/user', userRoutes)
app.use('/api/captain',captainRoutes)

app.use('/api/otp', otpRoutes);

app.use('/api/locations', locationRoutes);

// Add a test route to create a captain with complete vehicle details
app.post('/api/test/create-captain', async (req, res) => {
  try {
    // Create a test captain with complete vehicle details
    const testCaptain = new Captain({
      name: "Test Driver",
      email: "testdriver@example.com",
      phoneNumber: "+1234567890",
      password: "password123", // In production, this would be hashed
      drivingLicense: {
        number: "DL12345678",
        expiryDate: new Date('2025-12-31')
      },
      vehicle: {
        make: "Toyota",
        model: "Camry",
        year: 2022,
        color: "Blue",
        licensePlate: "ABC-1234"
      },
      isVerified: true,
      isActive: true,
      rating: 4.8,
      currentLocation: {
        lat: 37.7749,
        lon: -122.4194
      }
    });

    await testCaptain.save();
    
    res.status(201).json({
      success: true,
      message: "Test captain created successfully",
      captainId: testCaptain._id
    });
  } catch (error) {
    console.error("Error creating test captain:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test captain",
      error: error.message
    });
  }
});

// ======= SOCKET LOGIC (refactored) =======
const setupSocket = require('./socket/index');
setupSocket(io);

// ======= SERVER START =======
connectDB().then(() => {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

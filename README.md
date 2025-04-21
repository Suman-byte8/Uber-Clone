# Online Cab Booking System API

This is the backend system of an online cab booking system. It features user/captain signup, JWT authentication, and protected routes. The system is built with Node.js, Express, and MongoDB.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [API Documentation](#api-documentation)
  - [User Routes](#user-routes)
  - [Captain Routes](#captain-routes)
  - [Location Routes](#location-routes)
  - [Socket Events](#socket-events)
- [Data Validation](#data-validation)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [License](#license)
- [Recent Updates](#recent-updates)

## Features
- User Authentication (signup, login, profile management)
- Captain Authentication (signup, login, profile management)
- JWT-based Authentication
- Location Services Integration
- Input Validation Middleware
- Protected Routes
- OpenStreetMap Integration
- Real-time Captain Socket Connection
- Ride Request and Matching System
- Captain Ride Management (Accept/Reject/Cancel)
- Browser Notifications for New Rides
- Real-time Location Tracking

## Technologies Used
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **express-validator** - Input validation
- **React Leaflet** - Map integration
- **OpenStreetMap API** - Location services
- **Socket.IO** - Real-time communication
- **Web Notifications API** - Browser notifications

## Installation

1. Clone the repository:
```bash
git clone <repository_url>
```

2. Navigate to project directory:
```bash
cd user-authentication-api
```

3. Install dependencies:
```bash
npm install
```

4. Configure environment variables:
```env
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
PORT=5000
```

5. Start the server:
```bash
npm start
```

## API Documentation

### User Routes

#### 1. User Signup
- **POST** `/api/users/signup`
- **Description**: Register a new user
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "password": "password123"
}
```
- **Response**:
```json
{
  "_id": "67892ba437902adc7e3d260c",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. User Login
- **POST** `/api/users/login`
- **Description**: Authenticate existing user
- **Request Body**:
```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "_id": "67892ba437902adc7e3d260c",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Get User Account Details
- **GET** `/api/users/account`
- **Description**: Get authenticated user details
- **Headers**:
```
Authorization: Bearer <token>
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "67892ba437902adc7e3d260c",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phoneNumber": "1234567890"
  }
}
```

#### 4. Get Public User Details
- **GET** `/api/users/:userId/public`
- **Description**: Get public user details (for ride matching)
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "67892ba437902adc7e3d260c",
    "name": "John Doe",
    "phoneNumber": "1234567890",
    "rating": 4.5
  }
}
```

### Captain Routes

#### 1. Captain Signup
- **POST** `/api/captain/signup`
- **Description**: Register a new captain
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "phoneNumber": "9876543210",
  "password": "password123",
  "vehicleDetails": {
    "model": "Toyota Camry",
    "year": 2020,
    "color": "Black",
    "licensePlate": "ABC123"
  }
}
```
- **Response**:
```json
{
  "_id": "67892ba437902adc7e3d260d",
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "phoneNumber": "9876543210",
  "vehicleDetails": {
    "model": "Toyota Camry",
    "year": 2020,
    "color": "Black",
    "licensePlate": "ABC123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Captain Login
- **POST** `/api/captain/login`
- **Description**: Authenticate existing captain
- **Request Body**:
```json
{
  "email": "janesmith@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "_id": "67892ba437902adc7e3d260d",
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "phoneNumber": "9876543210",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Get Captain Details
- **GET** `/api/captain/:captainId`
- **Description**: Get captain details (protected)
- **Headers**:
```
Authorization: Bearer <token>
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "67892ba437902adc7e3d260d",
    "name": "Jane Smith",
    "email": "janesmith@example.com",
    "phoneNumber": "9876543210",
    "vehicleDetails": {
      "model": "Toyota Camry",
      "year": 2020,
      "color": "Black",
      "licensePlate": "ABC123"
    },
    "isActive": true,
    "rating": 4.8
  }
}
```

#### 4. Get Public Captain Details
- **GET** `/api/captain/:captainId/public`
- **Description**: Get public captain details (for ride matching)
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "67892ba437902adc7e3d260d",
    "name": "Jane Smith",
    "phoneNumber": "9876543210",
    "vehicleDetails": {
      "model": "Toyota Camry",
      "color": "Black",
      "licensePlate": "ABC123"
    },
    "rating": 4.8
  }
}
```

### Location Routes

#### 1. Geocode Address
- **GET** `/api/location/geocode?address=<address>`
- **Description**: Convert address to coordinates
- **Response**:
```json
{
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "New York, NY, USA"
}
```

#### 2. Reverse Geocode
- **GET** `/api/location/reverse?lat=<latitude>&lng=<longitude>`
- **Description**: Convert coordinates to address
- **Response**:
```json
{
  "address": "New York, NY, USA",
  "details": {
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001"
  }
}
```

### Socket Events

Socket.IO is used for real-time communication between the server, users, and captains. Below are the key socket events implemented in the system:

#### Authentication
```javascript
// Connect with authentication
const socket = io(serverUrl, {
  auth: { token: "your-jwt-token" }
});

// Connection event
socket.on('connect', () => {
  console.log('Connected to socket server with ID:', socket.id);
});
```

#### Captain Registration
```javascript
// Register captain with the socket server
socket.emit('registerCaptain', {
  captainId: "67892ba437902adc7e3d260d",
  location: {
    lat: 40.7128,
    lng: -74.0060
  },
  isActive: true
});

// Registration acknowledgment
socket.on('registrationAcknowledged', (data) => {
  console.log('Registration acknowledged:', data);
});
```

#### Captain Location Updates
```javascript
// Update captain location
socket.emit('updateCaptainLocation', {
  captainId: "67892ba437902adc7e3d260d",
  location: {
    lat: 40.7135,
    lng: -74.0070
  }
});
```

#### Ride Requests
```javascript
// User requesting a ride
socket.emit('requestRide', {
  userId: "67892ba437902adc7e3d260c",
  pickupLocation: {
    lat: 40.7128,
    lng: -74.0060,
    address: "Times Square, New York, NY"
  },
  dropoffLocation: {
    lat: 40.7580,
    lng: -73.9855,
    address: "Central Park, New York, NY"
  },
  rideType: "car",
  price: 25.50,
  distance: 3.2,
  estimatedTime: 15
}, (response) => {
  console.log('Ride request response:', response);
});

// Captain receiving ride request
socket.on('newRideRequest', (data) => {
  console.log('New ride request:', data);
  // data contains rideId, userId, pickup/dropoff locations, price, etc.
});

// User notified when captain is found
socket.on('captainFound', (data) => {
  console.log('Captain found:', data);
  // data contains captainId, estimatedArrival time
});

// User notified when no captains are available
socket.on('noCaptainsAvailable', (data) => {
  console.log('No captains available for ride:', data.rideId);
});
```

#### Ride Management
```javascript
// Captain accepting a ride
socket.emit('acceptRide', {
  rideId: "ride-123456",
  captainId: "67892ba437902adc7e3d260d",
  captainLocation: {
    lat: 40.7135,
    lng: -74.0070
  },
  estimatedArrival: 5 // minutes
});

// Captain rejecting a ride
socket.emit('rejectRide', {
  rideId: "ride-123456",
  captainId: "67892ba437902adc7e3d260d",
  reason: "Too far away"
});

// Cancelling a ride (by either user or captain)
socket.emit('cancelRide', {
  rideId: "ride-123456",
  userId: "67892ba437902adc7e3d260c",
  captainId: "67892ba437902adc7e3d260d",
  cancelledBy: "user", // or "captain"
  reason: "Changed plans"
});

// Ride cancellation notification
socket.on('rideCancelled', (data) => {
  console.log('Ride cancelled:', data);
  // data contains rideId, cancelledBy, reason, etc.
});
```

## Code Samples

### Captain Registration in CaptainHome.jsx
```jsx
useEffect(() => {
  if (!socket || !captainId || !driverLocation) return;

  const registerCaptain = () => {
    registerCaptainEmitter(socket, {
      captainId,
      location: driverLocation,
      isActive: isDriverOnline
    });
  };

  // Register initially
  registerCaptain();

  // Re-register periodically to maintain connection
  const intervalId = setInterval(registerCaptain, 30000);

  return () => {
    clearInterval(intervalId);
  };
}, [socket, captainId, driverLocation, isDriverOnline]);
```

### Ride Request Handling in Server.js
```javascript
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
    
    // Find nearby captains and match the ride...
  } catch (error) {
    console.error('Error processing ride request:', error);
    if (callback) {
      callback({ status: 'error', message: 'Server error processing request' });
    }
  }
});
```

### Ride Notification UI in CaptainHome.jsx
```jsx
{showRideModal && incomingRide && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">New Ride Request</h2>
      
      {/* Rider details */}
      <div className="mb-4">
        <h3 className="font-semibold">Rider Details:</h3>
        <p>{riderDetails?.name || 'Customer'}</p>
        <p>{riderDetails?.phoneNumber || ''}</p>
        <div className="flex items-center mt-1">
          <div className="text-yellow-500 mr-1">★</div>
          <span>{riderDetails?.rating || '4.5'}</span>
        </div>
      </div>
      
      {/* Trip details */}
      <div className="mb-4">
        <h3 className="font-semibold">Trip Details:</h3>
        <div className="flex items-start mt-2">
          <div className="min-w-[24px] mr-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mx-auto"></div>
            <div className="w-0.5 h-10 bg-gray-300 mx-auto"></div>
            <div className="w-3 h-3 rounded-full bg-red-500 mx-auto"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm mb-2 line-clamp-1">
              {incomingRide.pickupLocation.address || 'Pickup location'}
            </p>
            <p className="text-sm line-clamp-1">
              {incomingRide.dropoffLocation.address || 'Dropoff location'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleRejectRide}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg w-[48%]"
        >
          Reject
        </button>
        <button
          onClick={handleAcceptRide}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg w-[48%]"
        >
          Accept
        </button>
      </div>
    </div>
  </div>
)}
```

## Recent Updates

### Captain Socket Connection & Ride Management (April 2025)

This update implements a comprehensive captain socket connection and ride management system:

- **Real-time Captain Connectivity**:
  - Implemented reliable socket connection for captains with auto-reconnection
  - Added periodic re-registration to maintain stable connections
  - Enhanced location tracking and status management

- **Ride Request System**:
  - Created complete ride request flow from users to captains
  - Implemented ride matching algorithm based on distance and availability
  - Added ride acceptance, rejection, and cancellation functionality

- **Notification System**:
  - Added real-time notifications for captains when new ride requests are received
  - Implemented browser notifications using the Web Notifications API
  - Created UI components to display ride details and status

- **Authentication Improvements**:
  - Fixed JWT token handling to support both new and legacy formats
  - Added public API endpoints for user and captain profile data
  - Enhanced error handling and validation throughout the application

- **Map Integration**:
  - Fixed map display in the CaptainHome component
  - Improved location tracking and display for captains
  - Enhanced distance calculation for captain-rider matching

These updates significantly enhance the real-time communication between riders and captains, creating a more robust and user-friendly experience for both parties.
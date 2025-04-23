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
- Enhanced Captain Details for Riders
- Duplicate Ride Request Prevention
- Intelligent Ride Assignment System

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
cd uber-clone
```

3. Install dependencies for server:
```bash
cd server
npm install
```

4. Install dependencies for client:
```bash
cd ../client
npm install
```

5. Configure environment variables:
```env
# Server .env
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
PORT=8000

# Client .env
VITE_BASE_URL=http://localhost:8000
```

6. Start the server:
```bash
cd ../server
npm start
```

7. Start the client:
```bash
cd ../client
npm run dev
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

## Recent Updates

### April 23, 2025 - Enhanced Ride Request System

#### Improved Captain-Rider Experience
- **Enhanced Captain Details**: Riders now receive comprehensive information about their captain, including:
  - Full name and profile photo
  - Phone number for direct contact
  - Vehicle details (make, model, color, year)
  - Vehicle number plate for easy identification
  - Rating information
  - Estimated arrival time

#### Fixed Ride Request Logic
- **Duplicate Request Prevention**: Implemented robust logic to prevent captains from receiving the same ride request multiple times
  - Added client-side duplicate detection using a request tracking system
  - Implemented server-side ride status management with proper state transitions
  - Added timeout handling for ride requests that aren't responded to

#### Ride Assignment System
- **Intelligent Ride Matching**: Enhanced the ride matching algorithm to:
  - Track captains who have rejected a ride to avoid reassigning to them
  - Properly handle ride state transitions (pending → assigned → completed)
  - Implement timeout-based reassignment for unresponsive captains

#### Socket Connection Improvements
- **Robust Socket Authentication**: Enhanced socket connection with proper JWT validation
  - Added development mode bypass option for testing
  - Improved error handling and logging for socket connections
  - Fixed connection timeout issues

#### UI Enhancements
- **Driver Details Panel**: Redesigned the driver details panel to prominently display:
  - Vehicle number plate with highlighted styling
  - Interactive call and message buttons
  - Clear presentation of all vehicle details
  - Estimated arrival time information

## How It Works

### Ride Request Flow
1. User requests a ride through the app
2. Server finds nearby available captains
3. Server sends ride request to the closest available captain
4. Captain can accept or reject the ride
5. If accepted, user is notified and receives captain details
6. If rejected or timed out, server finds another captain
7. Real-time location updates are shared during the ride
8. Both user and captain can cancel the ride if needed

### Socket Communication
The application uses Socket.IO for real-time communication between:
- Server and users for ride status updates
- Server and captains for ride requests and location updates
- Direct captain-to-user communication during rides

Key socket events include:
- `requestRide`: User requests a new ride
- `newRideRequest`: Captain receives a ride request
- `acceptRide`: Captain accepts a ride
- `rejectRide`: Captain rejects a ride
- `rideAccepted`: User is notified that a captain accepted their ride
- `updateLocation`: Captain shares their real-time location

### Captain-User Matching Algorithm
The system uses a sophisticated algorithm to match users with captains:
1. Calculates distance between user's pickup location and all available captains
2. Sorts captains by proximity (closest first)
3. Checks if captain is already in a ride or has rejected this ride
4. Sends ride request to the best match
5. Implements timeout-based retry mechanism if no response

## License
This project is licensed under the MIT License - see the LICENSE file for details.
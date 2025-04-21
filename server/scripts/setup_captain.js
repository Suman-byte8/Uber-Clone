const mongoose = require('mongoose');
const Captain = require('../models/captain.model');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// MongoDB connection configuration - use the direct connection string for testing
const MONGODB_URI = "mongodb+srv://sumansahawebdev:m8pNrygLpgOu5JUV@uber-clone.r1kg7.mongodb.net/";
console.log('Connecting to MongoDB Atlas...');

async function setupCaptain() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB Atlas successfully');

    // Find or create a default captain
    let captain = await Captain.findOne({ email: 'default_captain@example.com' });
    
    if (!captain) {
      console.log('Creating new default captain...');
      captain = new Captain({
        name: 'Default Captain',
        email: 'default_captain@example.com',
        password: 'password123', // In production, this should be hashed
        phoneNumber: '+1234567890',
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: '2022',
          color: 'Black',
          licensePlate: 'ABC123'
        },
        drivingLicense: {
          number: 'DL12345678',
          expiryDate: new Date('2025-12-31')
        },
        isActive: true, // Set to active by default
        isVerified: true,
        rating: 4.8,
        totalTrips: 120,
        earnings: 5000,
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Default location (longitude, latitude)
        }
      });
      
      await captain.save();
      console.log('Default captain created successfully');
    } else {
      console.log('Default captain already exists, updating...');
    }
    
    // Ensure captain is active and has a valid location
    const updatedLocation = {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // Default location (longitude, latitude)
    };
    
    // Update captain to be active with valid location
    const updatedCaptain = await Captain.findByIdAndUpdate(
      captain._id,
      { 
        isActive: true,
        location: updatedLocation
      },
      { new: true }
    );
    
    console.log('Captain updated with active status and valid location');
    
    // Create geospatial index if it doesn't exist
    try {
      console.log('Creating geospatial index on location field...');
      await Captain.collection.createIndex({ location: '2dsphere' });
      console.log('Geospatial index created successfully');
    } catch (indexError) {
      console.error('Error creating index:', indexError.message);
    }
    
    // Log captain details for verification
    const verifiedCaptain = await Captain.findById(captain._id);
    console.log('Captain details:', {
      id: verifiedCaptain._id.toString(),
      name: verifiedCaptain.name,
      isActive: verifiedCaptain.isActive,
      location: verifiedCaptain.location
    });
    
    console.log('Captain setup completed successfully');
    
  } catch (error) {
    console.error('Error setting up captain:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB Atlas. Please check your connection string and network.');
    }
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the setup function
setupCaptain();

// Simple script to activate a captain and update location
const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://sumansahawebdev:m8pNrygLpgOu5JUV@uber-clone.r1kg7.mongodb.net/";

// Define the Captain model directly to avoid import issues
const captainSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  vehicle: {
    make: String,
    model: String,
    year: String,
    color: String,
    licensePlate: String
  },
  drivingLicense: {
    number: String,
    expiryDate: Date
  },
  isActive: Boolean,
  isVerified: Boolean,
  rating: Number,
  totalTrips: Number,
  earnings: Number,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number] // [longitude, latitude]
  }
});

// Add geospatial index
captainSchema.index({ location: '2dsphere' });

// Create the model
const Captain = mongoose.model('Captain', captainSchema, 'captains');

async function activateCaptain() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas');

    // Find any captain
    const captains = await Captain.find().limit(1);
    
    if (captains.length === 0) {
      console.log('No captains found. Creating a new one...');
      
      // Create a new captain
      const newCaptain = new Captain({
        name: 'Emergency Captain',
        email: 'emergency@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: '2022',
          color: 'Black',
          licensePlate: 'EMERG1'
        },
        drivingLicense: {
          number: 'DL12345',
          expiryDate: new Date('2025-12-31')
        },
        isActive: true,
        isVerified: true,
        rating: 4.8,
        totalTrips: 100,
        earnings: 5000,
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi coordinates
        }
      });
      
      await newCaptain.save();
      console.log('Emergency captain created with ID:', newCaptain._id);
    } else {
      const captain = captains[0];
      console.log('Found captain:', captain._id);
      
      // Update the captain to be active with a valid location
      captain.isActive = true;
      captain.location = {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      };
      
      await captain.save();
      console.log('Captain activated and location updated');
    }
    
    // Verify the captain is now active
    const activeCaptains = await Captain.find({ isActive: true }).select('_id name email location');
    console.log(`Total active captains: ${activeCaptains.length}`);
    
    if (activeCaptains.length > 0) {
      activeCaptains.forEach(captain => {
        console.log(`- ${captain.name} (${captain._id}): Has location: ${!!captain.location}`);
      });
    }
    
    console.log('Captain activation completed successfully');
  } catch (error) {
    console.error('Error activating captain:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
activateCaptain();

// Script to update captain locations and add multiple test captains at different locations
const mongoose = require('mongoose');
const Captain = require('./server/models/captain.model');

// MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://sumansahawebdev:m8pNrygLpgOu5JUV@uber-clone.r1kg7.mongodb.net/";

async function updateCaptainLocation() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    // Set a longer timeout for the connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout
    });
    
    console.log('Connected to MongoDB Atlas successfully');

    // Find the default captain
    console.log('Finding default captain...');
    const captain = await Captain.findOne({ email: 'default_captain@example.com' });
    
    if (!captain) {
      console.log('Default captain not found. Creating a new one...');
      
      // Create a new default captain
      const newCaptain = new Captain({
        name: 'Default Captain',
        email: 'default_captain@example.com',
        password: 'password123',
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
        isActive: true,
        isVerified: true,
        rating: 4.8,
        totalTrips: 120,
        earnings: 5000,
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Default location (longitude, latitude)
        }
      });
      
      await newCaptain.save();
      console.log('Default captain created successfully with ID:', newCaptain._id.toString());
      
      return await updateCaptainLocation(); // Retry after creating captain
    }
    
    console.log('Found captain:', captain._id.toString());
    
    // Update captain's location with valid GeoJSON format
    const updatedLocation = {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // [longitude, latitude] for Delhi
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
    
    console.log('Captain location updated successfully');
    console.log('Updated captain details:', {
      id: updatedCaptain._id.toString(),
      isActive: updatedCaptain.isActive,
      location: updatedCaptain.location
    });
    
    // Create a few more test captains at different locations
    const testLocations = [
      { name: 'Captain Mumbai', coordinates: [72.8777, 19.0760] }, // Mumbai
      { name: 'Captain Bangalore', coordinates: [77.5946, 12.9716] }, // Bangalore
      { name: 'Captain Chennai', coordinates: [80.2707, 13.0827] }, // Chennai
      { name: 'Captain Kolkata', coordinates: [88.3639, 22.5726] }  // Kolkata
    ];
    
    console.log('Creating/updating test captains...');
    
    for (let i = 0; i < testLocations.length; i++) {
      const location = testLocations[i];
      const email = `captain_${i+1}@example.com`;
      
      console.log(`Processing ${location.name} (${email})...`);
      
      try {
        // Check if captain already exists
        let testCaptain = await Captain.findOne({ email });
        
        if (!testCaptain) {
          // Create new test captain
          testCaptain = new Captain({
            name: location.name,
            email: email,
            password: 'password123',
            phoneNumber: `+1234567${i+1}`,
            vehicle: {
              make: 'Toyota',
              model: 'Camry',
              year: '2022',
              color: 'Black',
              licensePlate: `TEST${i+1}`
            },
            drivingLicense: {
              number: `DL12345${i+1}`,
              expiryDate: new Date('2025-12-31')
            },
            isActive: true,
            isVerified: true,
            rating: 4.5 + (i * 0.1),
            totalTrips: 100 + (i * 10),
            earnings: 4000 + (i * 500),
            location: {
              type: 'Point',
              coordinates: location.coordinates
            }
          });
          
          await testCaptain.save();
          console.log(`Created test captain: ${location.name}`);
        } else {
          // Update existing test captain
          testCaptain.isActive = true;
          testCaptain.location = {
            type: 'Point',
            coordinates: location.coordinates
          };
          await testCaptain.save();
          console.log(`Updated test captain: ${location.name}`);
        }
      } catch (captainError) {
        console.error(`Error processing captain ${location.name}:`, captainError.message);
      }
    }
    
    console.log('All captains processed');
    
    // Verify all active captains
    try {
      console.log('Verifying active captains...');
      const activeCaptains = await Captain.find({ isActive: true }).select('_id name email location');
      console.log(`Total active captains: ${activeCaptains.length}`);
      
      if (activeCaptains.length > 0) {
        activeCaptains.forEach(captain => {
          const hasValidLocation = 
            !!captain.location && 
            !!captain.location.coordinates && 
            Array.isArray(captain.location.coordinates) && 
            captain.location.coordinates.length === 2;
            
          console.log(`- ${captain.name} (${captain.email}): Location valid: ${hasValidLocation}`);
        });
      } else {
        console.log('No active captains found.');
      }
    } catch (verifyError) {
      console.error('Error verifying captains:', verifyError.message);
    }
    
  } catch (error) {
    console.error('Error updating captain location:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to MongoDB Atlas. Please check your connection string and network.');
    }
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError.message);
    }
  }
}

// Run the update function
updateCaptainLocation();

const Captain = require('../models/captain.model');
const { validationResult } = require('express-validator');
const { hashPassword } = require('../services/hashPassword');
const { generateToken } = require('../services/JWToken'); // Updated import for JWT token generation
const { comparePassword } = require('../services/comparePassword');

// @desc    Register a new captain
// @route   POST /api/captains/signup
// @access  Public
const registerCaptain = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            email,
            phoneNumber,
            password,
            drivingLicense,
            vehicle
        } = req.body;

        // Check if captain already exists
        const existingCaptain = await Captain.findOne({
            $or: [{ email }, { phoneNumber }, { 'drivingLicense.number': drivingLicense.number }, { 'vehicle.licensePlate': vehicle.licensePlate }]
        });

        if (existingCaptain) {
            return res.status(400).json({ message: 'Captain with the provided details already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new captain
        const captain = await Captain.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            drivingLicense,
            vehicle
        });

        // Generate JWT token using the updated function
        const token = generateToken(captain._id, captain.role);

        res.status(201).json({
            message: 'Captain registered successfully',
            captain: {
                _id: captain._id,
                name: captain.name,
                email: captain.email,
                phoneNumber: captain.phoneNumber,
                role:captain.role,
                drivingLicense: captain.drivingLicense,
                vehicle: captain.vehicle,
                isVerified: captain.isVerified,
                isActive: captain.isActive,
                rating: captain.rating
            },
            token
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const loginCaptain = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find captain by email
        const captain = await Captain.findOne({ email });

        if (!captain) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValidPassword = await comparePassword(password, captain.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token with both id and role
        const token = generateToken(captain._id, captain.role); // Use captain.role from the model

        res.status(200).json({
            message: 'Captain logged in successfully',
            captain: {
                _id: captain._id,
                name: captain.name,
                email: captain.email,
                phoneNumber: captain.phoneNumber,
                role: captain.role, // Use captain.role from the model
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// Get captain details
const getCaptainDetails = async (req, res) => {
  try {
    const captainId = req.params.captainId;
    if (!captainId || captainId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Captain ID is required and must be valid.'
      });
    }
    // Find captain by ID and exclude sensitive information
    const captain = await Captain.findById(captainId)
      .select('-password -__v')
      .lean();

    if (!captain) {
      return res.status(404).json({
        success: false,
        message: 'Captain not found'
      });
    }

    // Return captain details without stats for now
    res.status(200).json({
      success: true,
      data: captain
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to calculate captain statistics
// const calculateCaptainStats = async (captainId) => {
//   try {
//     // Get completed trips
//     const completedTrips = await Trip.find({
//       captain: captainId,
//       status: 'completed'
//     });

//     // Calculate total trips
//     const totalTrips = completedTrips.length;

//     // Calculate total earnings
//     const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.fare, 0);

//     // Calculate average rating
//     const ratings = completedTrips.map(trip => trip.rating).filter(rating => rating);
//     const averageRating = ratings.length > 0
//       ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
//       : 0;

//     return {
//       totalTrips,
//       totalEarnings,
//       rating: averageRating
//     };
//   } catch (error) {
//     console.error('Error calculating captain stats:', error);
//     return {
//       totalTrips: 0,
//       totalEarnings: 0,
//       rating: 0
//     };
//   }
// };

// Update captain details
const updateCaptainDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const captainId = req.params.captainId;
    const updates = req.body;

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.email;
    delete updates.phone;
    delete updates.refreshToken;

    const captain = await Captain.findByIdAndUpdate(
      captainId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -__v');

    if (!captain) {
      return res.status(404).json({
        success: false,
        message: 'Captain not found'
      });
    }

    res.status(200).json({
      success: true,
      data: captain
    });
  } catch (error) {
    console.error('Error in updateCaptainDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle captain active status
const toggleOnlineStatus = async (req, res) => {
  try {
    const captainId = req.params.captainId;
    
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        success: false,
        message: 'Captain not found'
      });
    }

    // Toggle the active status
    captain.isActive = !captain.isActive;
    await captain.save();

    res.status(200).json({
      success: true,
      data: {
        isActive: captain.isActive
      }
    });
  } catch (error) {
    console.error('Error in toggleOnlineStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const captain = await Captain.findByIdAndUpdate(
      req.params.captainId,
      { 
        currentLocation: {
          lat:lat,
          lng:lng
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: captain
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
};

module.exports = {
  registerCaptain,
  loginCaptain,
  getCaptainDetails,
  updateCaptainDetails,
  toggleOnlineStatus,
  updateLocation
};

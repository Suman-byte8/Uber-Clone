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

        // Compare provided password with hashed password
        const isValidPassword = await comparePassword(password, captain.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(captain._id, captain.role);

        res.status(200).json({
            message: 'Captain logged in successfully',
            captain: {
                _id: captain._id,
                name: captain.name,
                email: captain.email,
                phoneNumber: captain.phoneNumber,
                role: captain.role,
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



module.exports = { registerCaptain,loginCaptain };

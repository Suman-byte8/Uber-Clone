const Captain = require('../models/captain.model');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { hashPassword } = require('../services/hashPassword');

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

        // Generate JWT token
        const token = jwt.sign(
            { id: captain._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Captain registered successfully',
            captain: {
                _id: captain._id,
                name: captain.name,
                email: captain.email,
                phoneNumber: captain.phoneNumber,
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

module.exports = { registerCaptain };

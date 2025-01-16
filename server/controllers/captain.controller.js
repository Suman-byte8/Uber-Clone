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
            phoneNumber,  // Updated from 'phone' to 'phoneNumber'
            password,
            drivingLicense,  // Updated from 'license' to 'drivingLicense'
            vehicle
        } = req.body;

        // Check if captain already exists
        const emailExists = await Captain.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const phoneExists = await Captain.findOne({ phoneNumber });  // Updated from 'phone' to 'phoneNumber'
        if (phoneExists) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

const hashedPassword = await hashPassword(password)

        // Create new captain
        const captain = await Captain.create({
            name,
            email,
            phoneNumber,  // Updated from 'phone' to 'phoneNumber'
            password:hashedPassword,
            drivingLicense,  // Updated from 'license' to 'drivingLicense'
            vehicle
        });

        if (captain) {
            // Generate JWT token
            const token = jwt.sign(
                { id: captain._id },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(201).json({
                _id: captain._id,
                name: captain.name,
                email: captain.email,
                phoneNumber: captain.phoneNumber,  // Updated from 'phone' to 'phoneNumber'
                drivingLicense: captain.drivingLicense,  // Updated from 'license' to 'drivingLicense'
                vehicle: captain.vehicle,
                isVerified: captain.isVerified,
                isActive: captain.isActive,
                token
            });
        } else {
            res.status(400).json({ message: 'Invalid captain data' });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = { registerCaptain };

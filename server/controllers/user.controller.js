const User = require('../models/user.model');
const { hashPassword } = require('../services/hashPassword');
const { generateToken } = require('../services/JWToken');

// @desc    Register a new user
// @route   POST /api/users/signup
// @access  Public

const signup = async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email or phone number'
            });
        }

        const hashedPassword = await hashPassword(password)

        // Create new user
        const user = await User.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,

        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role:user.role,
                token: generateToken(user._id,user.role)
            });
        } else {
            res.status(400).json({
                message: 'Invalid user data'
            });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error creating user',
            error: error.message
        });
    }
};

module.exports = { signup };

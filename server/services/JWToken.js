const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    // Generate JWT token valid for 30 days
    return jwt.sign(
        { 
            id: userId,
            role: role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

module.exports = { generateToken };

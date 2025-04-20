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

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

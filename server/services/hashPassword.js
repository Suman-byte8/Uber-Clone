const bcrypt = require('bcrypt');

const saltRounds = 10; // You can adjust the salt rounds based on your security requirement

// Function to hash a password
const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Hashing failed', error);
    }
};

module.exports = {
    hashPassword
};
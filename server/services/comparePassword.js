const bcrypt = require('bcrypt');

const comparePassword = async (userPassword, databasePassword) => {
    return await bcrypt.compare(userPassword, databasePassword);
};

module.exports = { comparePassword };


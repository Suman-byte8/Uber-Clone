const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
dotenv.config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

const userRoutes = require('./routes/user.route');
const captainRoutes = require('./routes/captain.route');

const otpRoutes = require('./routes/otp.route');
const locationRoutes = require('./routes/location.route');
app.use(cors());

app.use(express.json())

app.get('/', (req, res) => {
  res.send("Hello World");
})

connectDB()

app.use('/api/user', userRoutes)
app.use('/api/captain',captainRoutes)

app.use('/api/otp', otpRoutes);

app.use('/api/locations', locationRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

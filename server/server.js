const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const userRoutes = require('./routes/user.route');
const captainRoutes = require('./routes/captain.route');

app.use(express.json())

app.get('/', (req, res) => {
  res.send("Hello World");
})

connectDB()

app.use('/api/user', userRoutes)
app.use('/api/captain',captainRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

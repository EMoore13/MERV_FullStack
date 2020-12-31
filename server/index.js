// Imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Require and initialize environment variables
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/api/users');

// App Initialization
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);

// Express activation
app.listen(PORT, () => {
    console.log(`Server has started at port: ${PORT}`)
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Route Imports
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const mlRoutes = require('./routes/mlRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Add this line

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and is served
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));


// Connect to MongoDB
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('!!!!!!!!!! MONGODB CONNECTION ERROR !!!!!!!!!!');
    console.error(err);
    process.exit(1);
  });

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/messages', messageRoutes); // Add this line

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('HopeScan Backend Server is running.');
});

// --- GLOBAL ERROR HANDLING MIDDLEWARE ---
const errorHandler = (err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER CAUGHT AN ERROR: ", err.stack);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ message: 'An unexpected server error occurred. Please check the backend console.' });
};
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


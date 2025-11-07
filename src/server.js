const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "https://rfid-attendance-three.vercel.app", // Replace with your actual Vercel URL
  "http://localhost:5173", // Vite dev server
  "http://localhost:8080", // Vite dev server
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true // if you use cookies/auth
}));
app.use(helmet());
app.use(morgan('dev'));


// Routes

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));


// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
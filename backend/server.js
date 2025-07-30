const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./src/config/logger');
const connectDB = require('./src/config/database');
const reminderJob = require('./src/jobs/reminderJob');

// Import routes
const authRoutes = require('./src/routes/auth');
const prescriptionRoutes = require('./src/routes/prescriptions');
const reminderRoutes = require('./src/routes/reminders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EHR Reminder API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Start reminder job
    reminderJob.start();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 EHR Reminder API Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  reminderJob.stop();
  mongoose.connection.close(() => {
    logger.info('Database connection closed');
    process.exit(0);
  });
});
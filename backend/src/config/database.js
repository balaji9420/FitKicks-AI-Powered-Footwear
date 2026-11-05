const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
};
module.exports = { connectDB };

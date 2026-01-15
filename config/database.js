const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'riftory',
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    console.log(`[MongoDB] Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MongoDB] Disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

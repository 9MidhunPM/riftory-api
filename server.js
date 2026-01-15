const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { productsRouter, favoritesRouter, profileRouter } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase payload limit for image uploads (base64 images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Riftory API Server',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      favorites: '/api/favorites',
      profile: '/api/profile',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/profile', profileRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Riftory API Server`);
      console.log(`📍 Running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
      console.log('Available endpoints:');
      console.log(`  GET    /api/products          - All products`);
      console.log(`  GET    /api/products/my/:id   - My listings`);
      console.log(`  POST   /api/products          - Create product`);
      console.log(`  GET    /api/favorites/:id     - Get favorites`);
      console.log(`  POST   /api/favorites         - Add favorite`);
      console.log(`  DELETE /api/favorites         - Remove favorite`);
      console.log(`  GET    /api/profile/:id       - Get profile`);
      console.log(`  PUT    /api/profile/:id       - Update profile`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

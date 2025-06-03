const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Database és migrations importálása
const { testConnection } = require('./config/database');
const { createTables, insertSampleData } = require('./config/migrations');

// Route importálása
const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database kapcsolat tesztelése
console.log('🔄 Testing database connection...');
testConnection();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Toronyikenyér API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      setup: '/setup'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  let databaseStatus = 'disconnected';
  
  try {
    await pool.query('SELECT 1');
    databaseStatus = 'connected';
  } catch (error) {
    console.error('Health check database error:', error.message);
  }

  res.json({
    status: 'OK',
    server: 'running',
    database: databaseStatus,
    timestamp: new Date().toISOString()
  });
});


app.get('/setup', async (req, res) => {
  try {
    console.log('🔧 Starting database setup...');
    
    // Táblák létrehozása
    await createTables();
    console.log('✅ Tables created successfully');
    
    // Alapadatok beszúrása
    await insertSampleData();
    console.log('✅ Sample data inserted successfully');
    
    res.json({
      message: 'Database setup completed successfully!',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({
      message: 'Database setup failed',
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});


// API v1 info endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Toronyikenyér API v1',
    version: '1.0.0',
    endpoints: {
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      health: '/health'
    },
    documentation: 'https://github.com/toronyikenyer-app/api-docs',
    timestamp: new Date().toISOString()
  });
});

// API Routes regisztrálása
app.use('/api/v1/products', productsRoute);
app.use('/api/v1/orders', ordersRoute);

// 404 handler minden más route-ra
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requested_url: req.originalUrl,
    available_endpoints: {
      root: '/',
      health: '/health',
      setup: '/setup',
      api_info: '/api/v1',
      products: '/api/v1/products',
      orders: '/api/v1/orders'
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Server indítása
app.listen(PORT, () => {
  console.log(`🚀 Toronyikenyér API Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`🗂 Database setup: http://localhost:${PORT}/setup`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Visit http://localhost:3000/setup to create database tables');
  console.log('2. Check http://localhost:3000/health for system status');
  console.log('');
});

module.exports = app;
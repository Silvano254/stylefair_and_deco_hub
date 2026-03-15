const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const inquiryRoutes = require('./routes/inquiry');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Set security HTTP headers
app.use(helmet());

// Compression: Gzip compression for all responses
app.use(compression());

// Logging: HTTP request logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use(inquiryRoutes);

// 404 Handler - Routes that are not API/static
app.use((req, res) => {
  // If requesting an API endpoint that doesn't exist
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  // Otherwise serve SPA
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Global Error Handling Middleware (must be last)
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Handle validation errors
  if (err.validation) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.validation
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Style Fair Events server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Rate limiting: ${process.env.RATE_LIMIT_REQUESTS} requests per ${process.env.RATE_LIMIT_WINDOW_MS / 60000} minutes`);
});

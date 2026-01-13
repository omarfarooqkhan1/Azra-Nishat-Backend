const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables immediately
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const passport = require('passport');
const redis = require('redis');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const logger = require('./utils/logger');
const { requestLogger } = require('./middlewares/logger');
const swaggerUi = require('swagger-ui-express');
const specs = require('../swaggerDef');

// Import routes
const routes = require('./routes');
require('./config/passport');

// Connect to database
connectDB();

const app = express();

// Logging middleware - should be first
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Redis rate limiter
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err.message });
});

redisClient.connect();

const redisRateLimiter = require('./middlewares/rateLimiter')(redisClient);
app.use('/api/', redisRateLimiter);

// Enable CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Set security headers
app.use(helmet());

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compress responses
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Log API requests
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    userId: req.user ? req.user.id : null,
    ip: req.ip
  });
  next();
});

// Mount routes
app.use('/api', routes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for undefined routes
app.use('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  err.status = 'fail';
  logger.warn('Route not found', { url: req.originalUrl, ip: req.ip });
  next(err);
});

// Global error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', {
    message: err.message,
    stack: err.stack
  });

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack
  });

  process.exit(1);
});

module.exports = app;
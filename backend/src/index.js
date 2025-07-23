const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./database/connection');
const redis = require('./database/redis');

// Import routes
const authRoutes = require('./routes/auth');
const containerRoutes = require('./routes/containers');
const serverRoutes = require('./routes/servers');
const githubRoutes = require('./routes/github');
const monitoringRoutes = require('./routes/monitoring');
const domainRoutes = require('./routes/domains');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import services
const DockerService = require('./services/DockerService');
const GitHubService = require('./services/GitHubService');
const MonitoringService = require('./services/MonitoringService');
const DomainService = require('./services/DomainService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/containers', authMiddleware, containerRoutes);
app.use('/api/servers', authMiddleware, serverRoutes);
app.use('/api/github', authMiddleware, githubRoutes);
app.use('/api/monitoring', authMiddleware, monitoringRoutes);
app.use('/api/domains', authMiddleware, domainRoutes);

// Webhook endpoints (no auth required)
app.use('/webhooks/github', require('./routes/webhooks/github'));

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-container', (containerId) => {
    socket.join(`container-${containerId}`);
    logger.info(`Client ${socket.id} joined container ${containerId}`);
  });

  socket.on('leave-container', (containerId) => {
    socket.leave(`container-${containerId}`);
    logger.info(`Client ${socket.id} left container ${containerId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to other modules
app.set('io', io);

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize Docker service
    const dockerService = new DockerService(io);
    app.set('dockerService', dockerService);

    // Initialize GitHub service
    const githubService = new GitHubService();
    app.set('githubService', githubService);

    // Initialize monitoring service
    const monitoringService = new MonitoringService(io);
    app.set('monitoringService', monitoringService);

    // Initialize domain service
    const domainService = new DomainService();
    app.set('domainService', domainService);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Error initializing services:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Test database connection
    await database.authenticate();
    logger.info('Database connection established successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established successfully');

    // Initialize services
    await initializeServices();

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 
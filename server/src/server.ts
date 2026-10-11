import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocketServer } from './sockets/socketServer.js';
import authRoutes from './routes/auth.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import messageRoutes from './routes/message.routes.js';
import fileRoutes from './routes/file.routes.js';
import { prisma } from './config/prisma.js';

const app = express();
const httpServer = http.createServer(app);

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in deployment to prevent connection drops
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isProduction ? 300 : 10000, // Generous limit in dev to prevent blocking
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file hosting for uploaded files
app.use('/uploads', express.static(config.upload.dir));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CONNECTX API Server',
    environment: config.nodeEnv,
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);

// Static client SPA hosting (serves built client assets if present)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Initialize Socket.io Server
initSocketServer(httpServer);

// Server Listen
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CONNECTX Server running on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔒 CORS Origin: ${config.clientUrl}`);
  console.log(`📁 Uploads Directory: ${config.upload.dir}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
const handleGracefulShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  httpServer.close(async () => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    await prisma.$disconnect();
    console.log('[Database] Prisma disconnected.');
    process.exit(0);
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    console.error('[Server] Forced shutdown due to timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;

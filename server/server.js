require('dotenv').config();
const crypto = require('crypto');

// STARTUP SECURITY CHECKS
const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
];
const PRODUCTION_REQUIRED_ENV = [
  'ESEWA_MERCHANT_ID',
  'ESEWA_SECRET_KEY',
  'ESEWA_PAYMENT_URL',
  'ESEWA_SUCCESS_URL',
  'ESEWA_FAILURE_URL',
  'FONEPAY_MERCHANT_CODE',
  'FONEPAY_SECRET_KEY',
  'FONEPAY_RETURN_URL',
  'HOMA_PAN',
  'HOMA_NAME',
  'HOMA_ADDRESS',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ADMIN_EMAIL',
];
const WEAK_SECRETS = [
  'secret',
  'password',
  '123456',
  'homa',
  'test',
  'your_jwt_secret',
  'mysecret',
  'jwt_secret',
  'change_this',
];

const isProduction = process.env.NODE_ENV === 'production';
const requiredKeys = isProduction
  ? [...REQUIRED_ENV, ...PRODUCTION_REQUIRED_ENV]
  : REQUIRED_ENV;

for (const key of requiredKeys) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

function ensureStrongSecret(key) {
  const value = process.env[key] || '';
  const weak = WEAK_SECRETS.some((entry) => value.toLowerCase().includes(entry));
  const minLength = isProduction ? 64 : 32;
  const tooShort = value.length < minLength;

  if (!weak && !tooShort) return;

  if (isProduction) {
    if (weak) {
      console.error(`FATAL: ${key} is too weak. Use a random 64-character string.`);
      process.exit(1);
    }

    console.error(`FATAL: ${key} must be at least ${minLength} characters.`);
    process.exit(1);
  }

  const generated = crypto
    .createHash('sha256')
    .update(`${process.cwd()}|${key}|homa-dev-secret-fallback`)
    .digest('hex');
  process.env[key] = generated;
  console.warn(
    `WARN: ${key} was missing or weak. Using a stable development fallback secret.`,
  );
}

ensureStrongSecret('JWT_SECRET');
ensureStrongSecret('JWT_REFRESH_SECRET');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./src/config/db');
const { migrateEnvSmtpSettings } = require('./src/services/smtpService');
const routes = require('./src/routes/index');
const contactRouter = require('./src/routes/contactRoute');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
let server;

// Needed so secure cookies and rate limiting behave correctly behind proxies
app.set('trust proxy', 1);

// Security
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
}));
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = new Set(
        [
          process.env.CLIENT_URL,
          process.env.CLIENT_URLS,
          process.env.ALLOWED_CLIENT_ORIGINS,
        ]
          .filter(Boolean)
          .flatMap((value) => value.split(',').map((item) => item.trim()))
          .filter(Boolean),
      );

      if (!origin || allowed.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected. Key: ${key}, IP: ${req.ip}`);
  },
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.url === '/api/v1/health',
  }));
}

// Routes
app.use('/api/v1', routes);
app.use('/api/v1/contact', contactRouter);

// Root confirmation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HOMA API is running',
    status: 'ok',
  });
});

// 404
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

// Error handler
app.use(errorHandler);

async function bootstrap() {
  await connectDB();

  try {
    const migration = await migrateEnvSmtpSettings();
    if (migration.created) {
      console.log('SMTP settings migrated from environment.');
    }
  } catch (error) {
    console.warn(`SMTP migration skipped: ${error.message}`);
  }

  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`HOMA Server running on port ${PORT}`);
    if (process.send) process.send('ready');
  });
}

bootstrap().catch((error) => {
  console.error(`Server bootstrap failed: ${error.message}`);
  process.exit(1);
});

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  if (!server) {
    await mongoose.connection.close();
    process.exit(0);
  }
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

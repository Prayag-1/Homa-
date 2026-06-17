require("dotenv").config();

// STARTUP SECURITY CHECKS
const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const WEAK_SECRETS = [
  "secret",
  "password",
  "123456",
  "homa",
  "test",
  "your_jwt_secret",
  "mysecret",
  "jwt_secret",
  "change_this",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
  const value = process.env[key] || "";
  if (WEAK_SECRETS.some((weak) => value.toLowerCase().includes(weak))) {
    console.error(`FATAL: ${key} is too weak. Use a random 64-character string.`);
    process.exit(1);
  }
  if (value.length < 32) {
    console.error(`FATAL: ${key} must be at least 32 characters.`);
    process.exit(1);
  }
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./src/config/db");
const routes = require("./src/routes/index");
const contactRouter = require("./src/routes/contactRoute");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// Connect DB
connectDB();

// Security
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
}));
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [process.env.CLIENT_URL];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected. Key: ${key}, IP: ${req.ip}`);
  },
}));

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Routes
app.use("/api/v1", routes);
app.use("/api/v1/contact", contactRouter);

// Root confirmation
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HOMA API is running",
    status: "ok",
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`HOMA Server running on port ${PORT}`),
);

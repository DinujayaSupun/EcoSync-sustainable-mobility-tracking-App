require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Import all routes
const authRoutes = require("./routes/authRoutes");
const commuteRoutes = require("./routes/commuteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const smartCommuteRoutes = require("./routes/smartCommute.routes");
const challengeRoutes = require("./routes/challenge.routes");
const carbonRoutes = require("./routes/carbon.routes");
const badgeRoutes = require("./routes/badgeRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

// Import middleware
const errorHandler = require("./middleware/error.middleware");

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = new Set([
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
      ]);

      // Allow server-to-server tools (no Origin header) and allowed browser origins.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
  skip: (req) => {
    const path = req.originalUrl || "";

    if (path.startsWith("/api/auth")) return true;
    if (path.startsWith("/api/commute")) return true;

    // Gamification pages perform frequent reads and periodic sync.
    // Exclude these endpoints from the shared global bucket so
    // heavy commute usage does not block badges/leaderboard/challenges.
    if (
      path.startsWith("/api/challenges") ||
      path.startsWith("/api/badges") ||
      path.startsWith("/api/achievements") ||
      path.startsWith("/api/leaderboard")
    ) {
      return true;
    }

    return false;
  },
});
app.use("/api/", limiter);

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Admin API Documentation",
    customfavIcon: "/favicon.ico",
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/commute", commuteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/smart-commute", smartCommuteRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/carbon", carbonRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/weather", weatherRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Sustainability Project API",
    documentation: {
      swagger: "http://localhost:5000/api-docs",
      description: "Complete Admin API documentation with interactive testing",
    },
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile (Protected)",
      },
      commute: {
        log: "POST /api/commute/log (Protected)",
        history: "GET /api/commute/history (Protected)",
        summary: "GET /api/commute/emission-summary (Protected)",
      },
      admin: {
        stats: "GET /api/admin/stats (Admin Only)",
        users: "GET /api/admin/users (Admin Only)",
        documentation: "Visit /api-docs for detailed API documentation",
      },
    },
  });
});

// Error handling middleware
app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;

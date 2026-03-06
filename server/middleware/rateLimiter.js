const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for general admin endpoints
 * 100 requests per 15 minutes
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later",
      retryAfter:
        Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) +
        " minutes",
    });
  },
});

/**
 * Stricter rate limiter for sensitive operations (delete, update)
 * 20 requests per 15 minutes
 */
const strictAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message:
      "Too many modification requests. Please try again after 15 minutes",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Rate limit exceeded for sensitive operations",
      retryAfter:
        Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) +
        " minutes",
      tip: "This endpoint has stricter rate limits for security purposes",
    });
  },
});

/**
 * Rate limiter for login attempts
 * 5 requests per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes",
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts from this IP",
      retryAfter:
        Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) +
        " minutes",
      tip: "For security, login attempts are limited",
    });
  },
});

/**
 * Rate limiter for report generation and AI insights
 * 10 requests per 15 minutes (resource intensive operations)
 */
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many report generation requests",
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Report generation rate limit exceeded",
      retryAfter:
        Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) +
        " minutes",
      tip: "Report generation is resource-intensive and has stricter limits",
    });
  },
});

module.exports = {
  adminLimiter,
  strictAdminLimiter,
  loginLimiter,
  reportLimiter,
};

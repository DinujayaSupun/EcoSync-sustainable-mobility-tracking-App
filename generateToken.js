const jwt = require("jsonwebtoken");

// Replace with your admin user ID
const token = jwt.sign(
  { id: "admin123", role: "admin" },
  "super_secret_key_12345", // must match JWT_SECRET in your .env
  { expiresIn: "7d" }
);

console.log("Your admin JWT token:", token);
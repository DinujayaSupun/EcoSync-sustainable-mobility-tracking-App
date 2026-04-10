const jwt = require("jsonwebtoken");


const token = jwt.sign(
  { id: "admin123", role: "admin" },
  "super_secret_key_12345", 
  { expiresIn: "7d" }
);

console.log("Your admin JWT token:", token);
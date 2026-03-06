require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const seedBadges = require("./config/seedBadges");

// Log environment variables
console.log("OPENAI_API_KEY =", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");

// Connect to MongoDB and seed initial data
connectDB().then(() => seedBadges());

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Script to promote a user to admin
// Run this with: node setAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    faculty: String,
    total_co2_saved: Number,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

const setAdmin = async (email) => {
  try {
    await connectDB();

    const user = await User.findOneAndUpdate(
      { email: email },
      { role: "admin" },
      { new: true },
    );

    if (!user) {
      console.log("❌ User not found with email:", email);
    } else {
      console.log("✅ Successfully promoted user to admin:");
      console.log("   Name:", user.name);
      console.log("   Email:", user.email);
      console.log("   Role:", user.role);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Change this email to the user you want to promote
const emailToPromote = "admin@my.sliit.lk";

setAdmin(emailToPromote);

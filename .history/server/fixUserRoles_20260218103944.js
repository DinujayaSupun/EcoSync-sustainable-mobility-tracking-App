// Script to fix invalid user roles in the database
// Run this with: node fixUserRoles.js

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

const fixUserRoles = async () => {
  try {
    await connectDB();

    // Find all users with invalid roles (not 'user' or 'admin')
    const invalidUsers = await User.find({
      role: { $nin: ["user", "admin"] },
    });

    console.log(`\n📊 Found ${invalidUsers.length} users with invalid roles\n`);

    if (invalidUsers.length === 0) {
      console.log("✅ All users have valid roles!");
      process.exit(0);
      return;
    }

    // Display users before fixing
    console.log("Users with invalid roles:");
    invalidUsers.forEach((user) => {
      console.log(`   - ${user.email} (current role: "${user.role}")`);
    });

    // Fix all invalid roles to 'user'
    const result = await User.updateMany(
      { role: { $nin: ["user", "admin"] } },
      { $set: { role: "user" } },
    );

    console.log(
      `\n✅ Successfully fixed ${result.modifiedCount} user roles to "user"\n`,
    );

    // Verify the fix
    const fixedUsers = await User.find({
      _id: { $in: invalidUsers.map((u) => u._id) },
    });

    console.log("Updated users:");
    fixedUsers.forEach((user) => {
      console.log(`   ✓ ${user.email} → role: "${user.role}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
fixUserRoles();

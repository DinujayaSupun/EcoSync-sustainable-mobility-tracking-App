// Script to check all users and their roles
// Run this with: node checkUsers.js

require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected\n");
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

const checkUsers = async () => {
  try {
    await connectDB();

    const allUsers = await User.find({}).select("name email role faculty");

    console.log(`📊 Total Users: ${allUsers.length}\n`);
    console.log("=".repeat(80));
    console.log(
      "Name".padEnd(25),
      "Email".padEnd(30),
      "Role".padEnd(10),
      "Faculty",
    );
    console.log("=".repeat(80));

    const adminUsers = [];
    const regularUsers = [];

    allUsers.forEach((user) => {
      const displayName = user.name.padEnd(25);
      const displayEmail = user.email.padEnd(30);
      const displayRole = user.role.padEnd(10);
      const displayFaculty = user.faculty || "N/A";

      console.log(displayName, displayEmail, displayRole, displayFaculty);

      if (user.role === "admin") {
        adminUsers.push(user);
      } else {
        regularUsers.push(user);
      }
    });

    console.log("=".repeat(80));
    console.log(`\n👑 Admin Users: ${adminUsers.length}`);
    console.log(`👤 Regular Users: ${regularUsers.length}\n`);

    if (adminUsers.length > 0) {
      console.log("Admin accounts for testing:");
      adminUsers.forEach((admin) => {
        console.log(`   - ${admin.email} (${admin.name})`);
      });
    }

    if (regularUsers.length > 0) {
      console.log("\nRegular user accounts for testing:");
      regularUsers.forEach((user) => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Run the script
checkUsers();

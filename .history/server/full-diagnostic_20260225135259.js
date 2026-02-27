// Direct MongoDB Connection Test - Bypasses DNS issues
require("dotenv").config();
const mongoose = require("mongoose");

console.log("\n🔧 COMPREHENSIVE MONGODB TROUBLESHOOTING\n");
console.log("═══════════════════════════════════════════════════════\n");

// Show what we're trying to connect to
const uri = process.env.MONGO_URI;
console.log("📋 Connection Details:");
console.log("   URI:", uri.replace(/:([^:@]+)@/, ":****@"));

// Extract details
const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)/);
if (match) {
  const [, username, password, host] = match;
  console.log("   Username:", username);
  console.log(
    "   Password:",
    "****" + (password.length > 2 ? password.slice(-2) : ""),
  );
  console.log("   Cluster:", host);
}
console.log("\n─────────────────────────────────────────────────────────\n");

// Test 1: Try with longer timeout and more retries
console.log("🧪 Test 1: Attempting connection with extended timeout...\n");

const options = {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  retryWrites: true,
  retryReads: true,
};

mongoose
  .connect(uri, options)
  .then((conn) => {
    console.log("✅✅✅ SUCCESS! CONNECTION ESTABLISHED! ✅✅✅\n");
    console.log("   Host:", conn.connection.host);
    console.log("   Database:", conn.connection.name);
    console.log("   Ready State:", conn.connection.readyState);
    console.log("\n🎉 YOUR MONGODB CONNECTION IS WORKING!\n");
    console.log("You can now run: npm start\n");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ CONNECTION FAILED\n");
    console.log("Error Code:", err.code || "N/A");
    console.log("Error Name:", err.name);
    console.log("Error Message:", err.message);
    console.log("\n═══════════════════════════════════════════════════════\n");
    console.log("🚨 DIAGNOSIS:\n");

    if (
      err.message.includes("ENOTFOUND") ||
      err.message.includes("queryA") ||
      err.message.includes("getaddrinfo")
    ) {
      console.log("❌ ISSUE: DNS Resolution Failure");
      console.log("\n📍 Your cluster hostname cannot be resolved.");
      console.log("\nPOSSIBLE CAUSES:");
      console.log("   1. ❌ Cluster does not exist in MongoDB Atlas");
      console.log("   2. ❌ Wrong connection string");
      console.log("   3. ❌ Corporate network blocking MongoDB Atlas");
      console.log("   4. ❌ Firewall/VPN interference");
      console.log("\n✅ SOLUTION:");
      console.log("   → Open MongoDB Atlas: https://cloud.mongodb.com/");
      console.log('   → Go to Database → Click "Connect" on your cluster');
      console.log("   → Copy the EXACT connection string");
      console.log("   → Verify the cluster hostname matches");
      console.log("   → If on campus/corporate WiFi, try mobile hotspot");
    } else if (
      err.message.includes("IP") ||
      err.message.includes("whitelist")
    ) {
      console.log("❌ ISSUE: IP Address Not Whitelisted");
      console.log("\n✅ SOLUTION:");
      console.log("   → MongoDB Atlas → Network Access");
      console.log("   → Add IP: 0.0.0.0/0 (allow all)");
      console.log("   → WAIT 5 FULL MINUTES");
      console.log("   → Try again");
    } else if (
      err.message.includes("auth") ||
      err.message.includes("credential")
    ) {
      console.log("❌ ISSUE: Authentication Failed");
      console.log("\n✅ SOLUTION:");
      console.log("   → MongoDB Atlas → Database Access");
      console.log(
        '   → Verify user "' + (match ? match[1] : "unknown") + '" exists',
      );
      console.log("   → Check password is correct");
      console.log("   → If unsure, delete user and create new one");
    } else if (
      err.message.includes("timeout") ||
      err.message.includes("ETIMEDOUT")
    ) {
      console.log("❌ ISSUE: Connection Timeout");
      console.log("\n✅ SOLUTION:");
      console.log("   → Your network is blocking port 27017");
      console.log("   → Try mobile hotspot");
      console.log("   → Check firewall settings");
      console.log("   → Disable VPN temporarily");
    } else {
      console.log("❌ ISSUE: Unknown Error");
      console.log("\nFull error:", err);
    }

    console.log("\n═══════════════════════════════════════════════════════\n");
    process.exit(1);
  });

console.log("⏳ Waiting for connection (timeout: 30 seconds)...\n");

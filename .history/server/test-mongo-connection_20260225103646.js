// Test MongoDB Connection Script
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');
console.log('Using URI:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

const testConnection = async () => {
    try {
        console.log('\n⏳ Attempting to connect...');
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('\n✅ SUCCESS! MongoDB Connected');
        console.log('📍 Host:', conn.connection.host);
        console.log('📦 Database:', conn.connection.name);
        console.log('✅ Connection is working correctly!\n');
        
        await mongoose.disconnect();
        console.log('👋 Disconnected successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ CONNECTION FAILED');
        console.error('Error Type:', error.name);
        console.error('Error Message:', error.message);
        
        if (error.message.includes('IP')) {
            console.error('\n🚨 IP WHITELIST ISSUE:');
            console.error('   1. Go to https://cloud.mongodb.com/');
            console.error('   2. Select your project');
            console.error('   3. Network Access → IP Access List');
            console.error('   4. Verify 0.0.0.0/0 is listed');
            console.error('   5. Wait 5 minutes and try again');
        } else if (error.message.includes('authentication')) {
            console.error('\n🔑 CREDENTIALS ISSUE:');
            console.error('   Username or password is incorrect');
            console.error('   Check Database Access in Atlas');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n🌐 NETWORK/DNS ISSUE:');
            console.error('   1. Check your internet connection');
            console.error('   2. Try disabling VPN');
            console.error('   3. Check if port 27017 is blocked by firewall');
        }
        
        process.exit(1);
    }
};

testConnection();

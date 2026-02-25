// MongoDB IP Whitelist Tester
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 MongoDB Atlas IP Whitelist Diagnostic Tool');
console.log('═══════════════════════════════════════════════════════════\n');

async function runDiagnostics() {
    const mongoUri = process.env.MONGO_URI;
    
    // Step 1: Check if URI exists
    console.log('📋 Step 1: Checking MongoDB URI');
    if (!mongoUri) {
        console.log('❌ MONGO_URI not found in .env file');
        return;
    }
    console.log('✅ MONGO_URI exists\n');

    // Step 2: Parse the connection string
    console.log('📋 Step 2: Parsing Connection String');
    try {
        const urlMatch = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)/);
        if (urlMatch) {
            const [, username, password, host] = urlMatch;
            console.log('✅ Username:', username);
            console.log('✅ Password:', '****' + password.slice(-2));
            console.log('✅ Cluster Host:', host);
            console.log('');

            // Step 3: DNS Resolution Test
            console.log('📋 Step 3: Testing DNS Resolution');
            try {
                const addresses = await dns.resolve(host);
                console.log('✅ DNS Resolution SUCCESS');
                console.log('   Resolved IPs:', addresses.join(', '));
                console.log('');
            } catch (dnsError) {
                console.log('❌ DNS Resolution FAILED');
                console.log('   Error:', dnsError.message);
                console.log('\n🚨 CLUSTER DOES NOT EXIST OR CONNECTION STRING IS WRONG');
                console.log('   → Go to MongoDB Atlas and get the correct connection string');
                console.log('   → Your cluster might be deleted, paused, or the URL is incorrect\n');
                return;
            }

            // Step 4: Test MongoDB Connection
            console.log('📋 Step 4: Testing MongoDB Connection');
            mongoose.set('serverSelectionTimeoutMS', 8000);
            
            try {
                const conn = await mongoose.connect(mongoUri);
                console.log('✅ CONNECTION SUCCESS!');
                console.log('   Host:', conn.connection.host);
                console.log('   Database:', conn.connection.name || '(default)');
                console.log('\n🎉 Your IP IS whitelisted and connection works!\n');
                await mongoose.disconnect();
                process.exit(0);
            } catch (connError) {
                console.log('❌ CONNECTION FAILED');
                console.log('   Error:', connError.message);
                
                if (connError.message.includes('IP') || connError.message.includes('whitelist')) {
                    console.log('\n🚨 IP WHITELIST ISSUE CONFIRMED\n');
                    console.log('═════════════════════════════════════════════════════════');
                    console.log('HOW TO FIX IN MONGODB ATLAS:');
                    console.log('═════════════════════════════════════════════════════════');
                    console.log('1. Go to: https://cloud.mongodb.com/');
                    console.log('2. Sign in to your MongoDB Atlas account');
                    console.log('3. Select your PROJECT (not organization)');
                    console.log('4. Click "Network Access" in the LEFT sidebar (under Security)');
                    console.log('5. Click the green "+ ADD IP ADDRESS" button');
                    console.log('6. Click "ALLOW ACCESS FROM ANYWHERE"');
                    console.log('7. Confirm it shows: 0.0.0.0/0');
                    console.log('8. Add a comment: "Development Access"');
                    console.log('9. Click "Confirm"');
                    console.log('10. ⏰ WAIT 2-5 MINUTES (this is critical!)');
                    console.log('11. Run this test again: node test-ip-whitelist.js');
                    console.log('═════════════════════════════════════════════════════════\n');
                } else if (connError.message.includes('authentication') || connError.message.includes('credentials')) {
                    console.log('\n🚨 AUTHENTICATION ISSUE\n');
                    console.log('Your username or password is incorrect.');
                    console.log('Fix in MongoDB Atlas:');
                    console.log('1. Go to "Database Access" in left sidebar');
                    console.log('2. Verify user "' + username + '" exists');
                    console.log('3. If not, create it or reset the password\n');
                } else {
                    console.log('\n🚨 OTHER CONNECTION ISSUE');
                    console.log('This might be:');
                    console.log('   - Firewall blocking port 27017');
                    console.log('   - VPN interference');
                    console.log('   - Cluster is paused or deleted\n');
                }
                process.exit(1);
            }
        } else {
            console.log('❌ Invalid MongoDB URI format\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        process.exit(1);
    }
}

runDiagnostics();

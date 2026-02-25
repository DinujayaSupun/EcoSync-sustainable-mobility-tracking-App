# 🔧 COMPLETE MongoDB Atlas Setup Guide

## STEP 1: CHECK IF YOUR CLUSTER EXISTS

1. Go to: https://cloud.mongodb.com/
2. Sign in with your MongoDB Atlas account
3. Click on "Database" in the left sidebar
4. Look for your cluster

### What do you see?

#### A) ✅ You see a cluster (Cluster0 or similar):
   - Check if it shows "ACTIVE" status
   - If it shows "PAUSED", click the "..." menu → "Resume"
   - Continue to STEP 2

#### B) ❌ No cluster visible / Empty:
   - You need to create a new cluster
   - Continue to STEP 3

---

## STEP 2: GET CORRECT CONNECTION STRING (If cluster exists)

1. Find your cluster in the Database view
2. Click the **"Connect"** button (on your cluster card)
3. A modal will pop up with 3 options
4. Click **"Drivers"** (or "Connect your application")
5. Select: **Driver: Node.js** and **Version: 5.5 or later**
6. You'll see a connection string like:
   ```
   mongodb+srv://<username>:<password>@clusterXXX.XXXXX.mongodb.net/?retryWrites=true&w=majority
   ```
7. **COPY this entire string**
8. Replace `<username>` with: `afNew`
9. Replace `<password>` with: `afNew`
10. Update your .env file with this new connection string

---

## STEP 3: CREATE A NEW FREE CLUSTER (If no cluster exists)

### 3A. Create Cluster

1. In MongoDB Atlas, click **"Database"** in left sidebar
2. Click the green **"+ Create"** button (or "Build a Database")
3. Choose **"M0 FREE"** tier (it's free forever)
4. Select settings:
   - **Cloud Provider**: Any (AWS, Google Cloud, or Azure)
   - **Region**: Choose one closest to you
   - **Cluster Name**: Keep "Cluster0" or choose your own
5. Click **"Create Cluster"** (or "Create Deployment")
6. Wait 1-3 minutes for cluster to deploy

### 3B. Create Database User

1. A modal will ask you to create a user
2. Or go to **"Database Access"** in left sidebar → **"+ ADD NEW DATABASE USER"**
3. Fill in:
   - **Username**: `afNew`
   - **Password**: `afNew` (or click "Autogenerate Secure Password" and save it)
   - **Database User Privileges**: Select **"Read and write to any database"**
4. Click **"Add User"**

### 3C. Whitelist Your IP

1. Go to **"Network Access"** in left sidebar (under Security section)
2. Click **"+ ADD IP ADDRESS"** button
3. Click **"ALLOW ACCESS FROM ANYWHERE"**
4. It will auto-fill: `0.0.0.0/0`
5. Add description: "Development Access"
6. Click **"Confirm"**
7. **WAIT 2-3 MINUTES** for this to take effect

### 3D. Get Connection String

1. Go back to **"Database"** in left sidebar
2. Your cluster should show "Active" status now
3. Click **"Connect"** button
4. Click **"Drivers"**
5. Copy the connection string shown
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password

---

## STEP 4: UPDATE YOUR .ENV FILE

Once you have the correct connection string, update your .env:

```env
PORT=5000
NODE_ENV=development

# Use the EXACT connection string from MongoDB Atlas
# Add /sustainabilityDB before the ? to specify database name
MONGO_URI=mongodb+srv://afNew:afNew@cluster0.XXXXX.mongodb.net/sustainabilityDB?retryWrites=true&w=majority

JWT_SECRET=super_secret_key_12345
CLIENT_URL=http://localhost:5173
```

**IMPORTANT**: The `XXXXX` in `cluster0.XXXXX.mongodb.net` must match what Atlas gives you!

---

## STEP 5: TEST YOUR CONNECTION

Run this command:
```bash
node test-ip-whitelist.js
```

You should see:
```
✅ DNS Resolution SUCCESS
✅ CONNECTION SUCCESS!
🎉 Your IP IS whitelisted and connection works!
```

---

## TROUBLESHOOTING

### "DNS Resolution FAILED"
→ Connection string is wrong or cluster doesn't exist
→ Go back to Atlas and get the correct connection string

### "IP whitelist" error
→ Go to Network Access → Add 0.0.0.0/0
→ Wait 2-3 minutes

### "Authentication failed"
→ Username or password is wrong
→ Check Database Access in Atlas
→ Try resetting the password

---

## COMMON MISTAKES

❌ Not waiting 2-3 minutes after whitelisting IP
❌ Using old connection string from deleted cluster
❌ Wrong username/password
❌ Cluster is paused (resume it)
❌ Looking at wrong Atlas project

---

**Need the actual steps done?** Share a screenshot of your MongoDB Atlas Database page or tell me what you see there!

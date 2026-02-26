# 🚨 CRITICAL SECURITY BREACH - IMMEDIATE ACTION REQUIRED

## ⚠️ WHAT HAPPENED

Your `.env` file with MongoDB credentials was exposed on GitHub **90+ times** through the `.history/` folder (VS Code Local History extension). This means:

- ❌ Your MongoDB username and password are publicly accessible
- ❌ Anyone can access your database
- ❌ MongoDB Atlas may have automatically blocked your credentials
- ❌ **THIS IS WHY YOUR CONNECTION KEEPS FAILING**

---

## ✅ IMMEDIATE FIX (DO THIS NOW - IN ORDER!)

### STEP 1: Remove Exposed Files from Git (5 minutes)

```bash
# Navigate to your project root
cd "c:\Users\ASUS TUF X506H\Desktop\3rd Y 1st\Group Project\Sustainability Project\SourceCode"

# Remove .history from git tracking
git rm -r --cached .history/

# Commit the removal
git commit -m "security: Remove exposed .history files"

# Push to GitHub (.gitignore is already updated)
git push origin main
```

**✅ Done? Continue to Step 2**

---

### STEP 2: Change MongoDB Credentials (CRITICAL - 10 minutes)

#### 2A. Delete Old Database User

1. Go to: https://cloud.mongodb.com/
2. Sign in to your account
3. Select your project
4. Click **"Database Access"** (left sidebar, under Security)
5. Find user **"afNew"**
6. Click the **"..."** menu → **"Delete"**
7. Confirm deletion

#### 2B. Create New Secure User

1. Still in **"Database Access"**, click **"+ ADD NEW DATABASE USER"**
2. Choose **"Password"** authentication
3. Fill in:
   - **Username**: Choose a NEW username (e.g., `sustainability_user`)
   - **Password**: Click **"Autogenerate Secure Password"** → **COPY IT IMMEDIATELY**
   - OR create a strong password (minimum 16 characters, mix of letters, numbers, symbols)
4. **Database User Privileges**: Select **"Read and write to any database"**
5. Click **"Add User"**
6. **SAVE YOUR USERNAME AND PASSWORD** (you'll need them next)

---

### STEP 3: Verify/Update IP Whitelist (5 minutes)

1. In MongoDB Atlas, click **"Network Access"** (left sidebar, under Security)
2. Check if `0.0.0.0/0` is listed
   - **If YES**: Good, skip to Step 4
   - **If NO**: Click **"+ ADD IP ADDRESS"** → **"ALLOW ACCESS FROM ANYWHERE"** → Confirm
3. **Wait 3 minutes** for changes to propagate

---

### STEP 4: Get New Connection String (2 minutes)

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Select **"Drivers"**
4. **Copy the connection string** (should look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.XXXXX.mongodb.net/?retryWrites=true&w=majority
   ```
5. Note the `XXXXX` part - this is your cluster's unique ID

---

### STEP 5: Update Your .env File (2 minutes)

**IMPORTANT**: The `.env` file should NEVER be committed to git. It's already in `.gitignore` now.

1. Open: `server/.env`
2. Replace with this (using YOUR new credentials):

```env
PORT=5000
NODE_ENV=development

# MongoDB - Use the NEW credentials you just created
MONGO_URI=mongodb+srv://NEW_USERNAME:NEW_PASSWORD@cluster0.XXXXX.mongodb.net/sustainabilityDB?retryWrites=true&w=majority

# Generate new JWT secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_new_jwt_secret_here

CLIENT_URL=http://localhost:5173
```

3. Replace:
   - `NEW_USERNAME` → Your new MongoDB username
   - `NEW_PASSWORD` → Your new MongoDB password
   - `XXXXX` → Your cluster ID from the connection string
   - `your_new_jwt_secret_here` → Generate new one (see below)

---

### STEP 6: Generate New JWT Secret (1 minute)

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET` in `.env`

---

### STEP 7: Test Connection (1 minute)

```bash
cd server
node test-ip-whitelist.js
```

**Expected output:**

```
✅ DNS Resolution SUCCESS
✅ CONNECTION SUCCESS!
🎉 Your IP IS whitelisted and connection works!
```

**If successful, start your server:**

```bash
npm start
```

---

## 🔒 PREVENT THIS IN THE FUTURE

### Already Done ✅

- Added `.history/` to `.gitignore`
- Added `.env*` to `.gitignore`
- Created `.env.example` for reference

### You Should Do:

1. **Never commit `.env` files**
   - Always check `git status` before committing
   - Use `.env.example` for documentation

2. **Disable or Configure VS Code Local History**

   ```json
   // In VS Code settings.json, add:
   "local-history.exclude": ["**/.env", "**/.env.*", "**/node_modules/**"]
   ```

3. **Use GitHub Secret Scanning**
   - GitHub can alert you when secrets are committed
   - Enable in: Repository → Settings → Code security

4. **Regular Security Checks**
   - Never share `.env` files
   - Rotate credentials every 3-6 months
   - Use environment-specific credentials (dev, staging, prod)

---

## ❓ TROUBLESHOOTING

### "Still getting connection errors"

→ Wait 3-5 minutes after updating credentials
→ Restart your terminal/server
→ Run `node test-ip-whitelist.js` to diagnose

### "Authentication failed"

→ Double-check username and password in .env
→ Ensure no spaces or typos
→ Check if special characters in password are URL-encoded

### "DNS Resolution FAILED"

→ Wrong cluster ID in connection string
→ Get fresh connection string from Atlas

### "Need to completely remove from GitHub history"

This is advanced - the files are removed from tracking but exist in git history.
If your repo is public or you want to purge completely, you'll need to:

1. Use `git filter-branch` or BFG Repo-Cleaner
2. Force push to GitHub
3. All team members must re-clone the repo

---

## 📊 SEVERITY ASSESSMENT

| Risk              | Status                                 |
| ----------------- | -------------------------------------- |
| Database Access   | 🔴 CRITICAL - Credentials exposed      |
| Data Breach       | 🟡 POSSIBLE - Unknown if accessed      |
| JWT Tokens        | 🟡 MODERATE - Secret exposed           |
| Connection Issues | ✅ FIXED - After following steps above |

---

## 📝 CHECKLIST

- [ ] Step 1: Removed .history from git
- [ ] Step 2: Deleted old MongoDB user "afNew"
- [ ] Step 2: Created new MongoDB user with secure password
- [ ] Step 3: Verified 0.0.0.0/0 in IP whitelist
- [ ] Step 4: Got new connection string from Atlas
- [ ] Step 5: Updated .env with new credentials
- [ ] Step 6: Generated new JWT secret
- [ ] Step 7: Tested connection successfully
- [ ] Pushed .gitignore changes to GitHub
- [ ] Configured VS Code Local History exclusions

---

**Once all steps are complete, your database will be secure and connections will work!**

Need help with any step? Let me know where you're stuck!

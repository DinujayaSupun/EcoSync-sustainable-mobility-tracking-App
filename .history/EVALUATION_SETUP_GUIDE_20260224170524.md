# Quick Setup Guide for Evaluation

## 📋 Pre-Evaluation Checklist

### 1. Create Admin Account

Run this script to create an admin user in your database:

```bash
cd server
node setAdmin.js
```

Or manually in MongoDB:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
```

### 2. Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select `Postman_Collection_Admin_Security.json`
4. Collection will be imported with all endpoints ready

### 3. Set Environment Variables

In Postman:

1. Click **Environments** (left sidebar)
2. Create new environment: "Sustainability Project"
3. Add variables:
   - `BASE_URL`: `http://localhost:5000`
   - `USER_TOKEN`: (leave empty)
   - `ADMIN_TOKEN`: (leave empty)

### 4. Start Your Server

```bash
cd server
npm install
npm start
```

Verify server is running at: http://localhost:5000

---

## 🎯 Evaluation Demo Flow

### Part 1: Authentication & Security (5 min)

1. **Show Registration Validation**
   - Test weak password → 400 error
   - Test invalid email → 400 error
   - Test valid registration → Success

2. **Show Login**
   - Login as regular user
   - Login as admin
   - Show JWT token in response

3. **Show Protected Routes**
   - Try accessing admin route without token → 401
   - Try accessing admin route with user token → 403
   - Access admin route with admin token → Success

### Part 2: Admin Dashboard Features (10 min)

4. **Admin Statistics**
   - GET `/api/admin/stats`
   - Show total users, CO2, active today, faculties

5. **User Management (Full CRUD)**
   - GET `/api/admin/users` - Show all users
   - PUT `/api/admin/users/:id` - Update user details (name, email, faculty, role)
   - DELETE `/api/admin/users/:id` - Delete a test user

6. **Recent Activity**
   - GET `/api/admin/recent-trips?limit=10`
   - Show live feed of trips

7. **Reporting System**
   - GET `/api/admin/report` - Full report
   - GET `/api/admin/report?faculty=Computing` - Filtered report
   - GET `/api/admin/report?startDate=2026-02-01&endDate=2026-02-24` - Date range

### Part 3: Security Features Highlight (3 min)

8. **Show Security Implementation**
   - Password hashing (show in code)
   - JWT middleware (show in code)
   - Role-based access (show in code)
   - Rate limiting (mention in server config)
   - Input validation (show error messages)

---

## 📊 Key Points to Mention

### Authentication Features:

✅ JWT-based stateless authentication  
✅ 7-day token expiration  
✅ Bcrypt password hashing (10 rounds)  
✅ Email validation with regex  
✅ Password strength requirements (min 8 chars)

### Authorization Features:

✅ Role-based access control (user/admin)  
✅ Protected routes middleware  
✅ Admin-only endpoints  
✅ Token verification on every request

### Security Best Practices:

✅ No passwords in API responses  
✅ Generic error messages (no user enumeration)  
✅ Rate limiting (100 req/15min)  
✅ CORS configuration  
✅ Helmet.js security headers  
✅ Input sanitization

### Admin Features:

✅ Comprehensive dashboard statistics  
✅ Full user management (view, update, delete)  
✅ Real-time activity monitoring  
✅ Advanced reporting with filters  
✅ Faculty-wise analytics  
✅ Top contributors tracking

---

## 🔑 Test Credentials

### Regular User

```
Email: testuser@example.com
Password: TestPass123
```

### Admin User

```
Email: admin@example.com
Password: AdminPass123
```

---

## 📝 Evaluation Script

**Opening Statement:**
"I was responsible for implementing the authentication system, admin dashboard, and security features for this sustainability tracking application. Let me demonstrate the key features."

**Demo Sequence:**

1. **"First, let me show the authentication system with validation"**
   - Run weak password test
   - Run valid registration
   - Explain bcrypt hashing

2. **"Now I'll demonstrate the security layers"**
   - Show 401 without token
   - Show 403 user accessing admin route
   - Show 200 admin accessing admin route
   - Explain JWT and middleware

3. **"Here are the admin dashboard features"**
   - Get statistics
   - Get all users
   - Get recent trips
   - Generate report

4. **"Let me show the advanced reporting system"**
   - Full report
   - Filtered by faculty
   - Filtered by date range
   - Explain data aggregation

5. **"Finally, the security implementations in code"**
   - Show middleware/authMiddleware.js
   - Show password validation in controllers
   - Show rate limiting in index.js
   - Show helmet security headers

**Closing Statement:**
"This implementation ensures secure user authentication, role-based access control, and comprehensive admin capabilities for managing the sustainability tracking system."

---

## 📸 Screenshots to Prepare

1. Postman collection overview
2. Successful authentication response
3. 403 Forbidden error (user accessing admin route)
4. Admin statistics response
5. Report generation with filters
6. Code showing middleware implementation
7. Code showing password hashing

---

## 🐛 Common Issues & Solutions

**Issue**: Can't login as admin  
**Fix**: Run setAdmin.js or update role in database

**Issue**: All admin routes returning 403  
**Fix**: Make sure you're using ADMIN_TOKEN, not USER_TOKEN

**Issue**: Token expired  
**Fix**: Login again to get fresh token

**Issue**: Server not starting  
**Fix**: Check if MongoDB is running and .env file exists

**Issue**: CORS error  
**Fix**: Update CLIENT_URL in .env file

---

## ⏱️ Timing Breakdown

- Setup & Introduction: 2 min
- Authentication Demo: 5 min
- Security Features: 3 min
- Admin Dashboard: 5 min
- Reporting System: 3 min
- Code Walkthrough: 2 min
- **Total: ~20 minutes**

---

## 💡 Bonus Points to Mention

1. **Scalability**: Stateless JWT allows horizontal scaling
2. **Security**: Industry-standard bcrypt with proper salting
3. **Performance**: Efficient MongoDB aggregations for reports
4. **UX**: Detailed error messages for better debugging
5. **Maintainability**: Clean code structure with middleware pattern

---

Good luck with your evaluation! 🚀

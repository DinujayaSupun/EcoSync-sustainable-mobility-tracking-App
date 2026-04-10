# Sustainability Project - Backend API

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Docker & Docker Compose
- MongoDB (via Docker)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the server directory:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/sustainability-project
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

3. **Start MongoDB with Docker:**

   ```bash
   cd ..
   docker-compose up -d
   ```

4. **Start the server:**
   ```bash
   npm start        # Production
   npm run dev      # Development with nodemon
   ```

## 📚 API Endpoints

### Authentication Routes

#### 1. Register User

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "faculty": "Engineering"
  }
  ```
- **Success Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "faculty": "Engineering"
    }
  }
  ```

#### 2. Login User

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "faculty": "Engineering",
      "total_co2_saved": 0
    }
  }
  ```

#### 3. Get User Profile

- **URL:** `/api/auth/profile`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token_here
  ```
- **Success Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "faculty": "Engineering",
      "total_co2_saved": 0,
      "createdAt": "2026-02-12T10:00:00.000Z"
    }
  }
  ```

## 🗂️ Project Structure

```
server/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── authMiddleware.js  # JWT verification & authorization
├── models/
│   └── User.js            # User model schema
├── routes/
│   └── authRoutes.js      # Auth route definitions
├── .env                   # Environment variables
├── index.js               # Express app entry point
└── package.json           # Dependencies
```

## 🔒 Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Docker** - MongoDB containerization

## 📝 Testing with Postman/Thunder Client

1. **Register a new user**
2. **Copy the token from the response**
3. **Use the token in Authorization header for protected routes**

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if Docker container is running
docker ps

# Start MongoDB container
docker-compose up -d

# Check container logs
docker logs sustainability-mongodb
```

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <process_id> /F
```

## 📦 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run unit + integration tests
- `npm run test:unit` - Run only unit tests in `tests/unit`
- `npm run test:integration` - Run only integration tests in `tests/integration`
- `npm run test:coverage` - Run coverage report
- `npm run test:performance` - Run Artillery load tests using `performance/artillery.yml`

## ✅ Additional Testing Setup

### 1. Unit Testing

- Unit tests are in `tests/unit`.
- These validate isolated functions without external services.
- Current examples:
  - `tests/unit/carbon.service.unit.test.js`
  - `tests/unit/emissionFactors.unit.test.js`

Run with:

```bash
npm run test:unit
```

### 2. Integration Testing

- Integration tests are in `tests/integration`.
- These validate API route + controller + middleware + MongoDB behavior together.
- Integration tests use `MONGODB_URI_TEST` (or fallback `MONGODB_URI`) for database connectivity.
- Current example:
  - `tests/integration/auth.integration.test.js`

Set a dedicated test DB URI in your `.env`:

```env
MONGODB_URI_TEST=mongodb://localhost:27017/sustainability-project-test
```

Run with:

```bash
npm run test:integration
```

### 3. Performance Testing (Artillery)

- Artillery scenario file: `performance/artillery.yml`
- This simulates concurrent traffic with warm-up, ramp-up, and sustained load phases.

Before running performance tests, start the server:

```bash
npm run dev
```

Then run load test in another terminal:

```bash
npm run test:performance
```

Recommended metrics to monitor:

- p95 and p99 response time
- Error rate (4xx/5xx)
- Throughput (requests/sec)

## 🔐 Environment Variables

| Variable   | Description               | Default                                          |
| ---------- | ------------------------- | ------------------------------------------------ |
| PORT       | Server port               | 5000                                             |
| MONGO_URI  | MongoDB connection string | mongodb://localhost:27017/sustainability-project |
| JWT_SECRET | Secret key for JWT        | -                                                |
| NODE_ENV   | Environment mode          | development                                      |

## 👥 User Roles

- **user** - Default role for registered users
- **admin** - Administrative role (manually set in database)

## 📄 License

This project is part of a group project for sustainability initiatives.

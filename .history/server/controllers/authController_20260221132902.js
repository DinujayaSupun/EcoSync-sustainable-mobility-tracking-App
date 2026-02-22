const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, faculty } = req.body;

    // 1. Basic Field Check
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Advanced Email Validation (Security Fix #1)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // 3. Password Strength Check (Security Fix #2)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // 4. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email",
      });
    }

    // 5. Create User (Bcrypt hashing happens in the User Model middleware)
    const user = await User.create({ name, email, password, faculty });

    // 6. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 7. Success Response (Excluding sensitive data like password)
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      },
    });
  } catch (error) {
    // 8. Professional Error Handling (Security Fix #8)
    console.error("Registration Error:", error.message); // Log for your own debugging
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // 2. Find user by email
    // We explicitly use .select('+password') if you set 'select: false' in your model for security
    const user = await User.findOne({ email });

    // 3. Unified Error Message (Security Fix #8 - Prevent User Enumeration)
    // We check if user exists AND if password matches in one flow
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 5. Successful Response
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
        total_co2_saved: user.total_co2_saved,
      },
    });
  } catch (error) {
    // 6. Professional Error Handling (Security Fix)
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "An internal error occurred. Please try again later.",
    });
  }
};

// GET /api/auth/profile
exports.getUserProfile = async (req, res) => {
  try {
    // 1. Fetch user using the ID attached by the 'protect' middleware
    // We use .select("-password") to ensure security (Fix #8 - Info Leakage)
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Return the data needed for the Dashboard and Profile pages
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
        total_co2_saved: user.total_co2_saved,
        joinedDate: user.createdAt, // Friendly naming for the UI
      },
    });
  } catch (error) {
    // 3. Generic Error for security (Fix #8)
    console.error("Profile Fetch Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve user profile",
    });
  }
};

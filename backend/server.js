const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://my-cricket-reg-app-zyg2.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5500','https://my-cricket-reg-app-zyg2.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('./'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://idscdb:idsc2025@cluster0.h7x7wsm.mongodb.net/idcs?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// Counter schema for sequential Player IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Enhanced Player Schema with new ID logic
const playerSchema = new mongoose.Schema({
  // Unique Identifiers - NEW LOGIC
  playerId: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: idsc + sequential number + ddmmyyyy
    // Example: idsc0104102025, idsc0204102025
  },
  userId: {
    type: String,
    // unique: true,
    required: true,
    index: true
  },

  // Sequential number for tracking
  sequenceNumber: {
    type: Number,
    required: true,
    index: true
  },

  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 10 && age <= 65;
      },
      message: 'Age must be between 10 and 65 years'
    }
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    index: true,
    validate: {
      validator: function(phone) {
        return /^[+]?[\d\s\-\(\)]{10,15}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },

  // Address Information
  streetAddress: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10
  },
  country: {
    type: String,
    default: 'India',
    trim: true,
    maxlength: 50
  },

  // Sports Information
  primarySport: {
    type: String,
    default: 'Cricket',
    trim: true,
    maxlength: 30
  },
  role: {
    type: String,
    // required: true,
    enum: ['Batsman', 'Bowler', 'All Rounder', 'Keeper Batsman'],
    index: true
  },
  battingOrderPreference: {
    type: String,
    // required: true,
    enum: ['Opening', 'Top Order', 'Middle Order', 'Lower Order']
  },
  bowlingStyle: {
    type: String,
    enum: ['Fast', 'Medium', 'Spin', 'None'],
    default: 'None'
  },
  battingStyle: {
    type: String,
    // required: true,
    enum: ['Right Handed Bat', 'Left Handed Bat']
  },
  bowlingArm: {
    type: String,
    enum: ['Right-arm Fast', 'Left-arm Fast', 'Right-arm Spin', 'Left-arm Spin']
  },

  // Account Information
  username: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
    validate: {
      validator: function(username) {
        return /^[a-zA-Z0-9_]+$/.test(username);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // Registration Metadata
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  registrationMetadata: {
    ip: String,
    userAgent: String,
    timestamp: Date,
    clientTimestamp: Number,
    clientRandom: String
  },

  // Status and Activity
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    index: true
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },

  // Verification Status
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  documentsVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
playerSchema.index({ playerId: 1 });
playerSchema.index({ userId: 1 });
playerSchema.index({ sequenceNumber: 1 });
playerSchema.index({ email: 1 });
playerSchema.index({ username: 1 });
playerSchema.index({ phone: 1 });
playerSchema.index({ city: 1, state: 1 });
playerSchema.index({ role: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ registrationDate: -1 });

// Virtual for full name
playerSchema.virtual('fullName').get(function() {
  let fullName = this.firstName;
  if (this.middleName) {
    fullName += ` ${this.middleName}`;
  }
  fullName += ` ${this.lastName}`;
  return fullName;
});

// Virtual for age calculation
playerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Pre-save middleware to hash password
playerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
playerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Player = mongoose.model('Player', playerSchema);

// Helper function to get next sequence number
async function getNextSequence() {
  const counter = await Counter.findByIdAndUpdate(
    'player_sequence',
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// Helper function to generate unique Player ID with NEW LOGIC
async function generateUniquePlayerId() {
  try {
    const sequenceNumber = await getNextSequence();

    // Get current date in ddmmyyyy format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}${month}${year}`;

    // Format sequence number with leading zeros (2 digits minimum)
    const seqStr = String(sequenceNumber).padStart(2, '0');

    // Create Player ID: idsc + sequence + ddmmyyyy
    const playerId = `idsc${seqStr}${dateStr}`.toUpperCase();

    console.log(`🆔 Generated Player ID: ${playerId} (Sequence: ${sequenceNumber}, Date: ${dateStr})`);

    return { playerId, sequenceNumber };
  } catch (error) {
    console.error('Error generating Player ID:', error);
    throw new Error('Failed to generate Player ID: ' + error.message);
  }
}

// Helper function to generate unique User ID (keeping existing logic)
async function generateUniqueUserId(userData) {
  let userId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    userId = `USER_${timestamp}_${random}`.toUpperCase();

    const existingUser = await Player.findOne({ userId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique User ID');
  }

  return userId;
}

// Validate unique fields before saving
async function validateUniqueFields(data, excludeId = null) {
  const errors = [];

  // Check email uniqueness
  const emailQuery = { email: data.email.toLowerCase() };
  if (excludeId) emailQuery._id = { $ne: excludeId };

  const existingEmail = await Player.findOne(emailQuery);
  if (existingEmail) {
    errors.push('Email address is already registered');
  }

  // Check username uniqueness
  const usernameQuery = { username: data.username };
  if (excludeId) usernameQuery._id = { $ne: excludeId };

  const existingUsername = await Player.findOne(usernameQuery);
  if (existingUsername) {
    errors.push('Username is already taken');
  }

  // Check phone uniqueness
  const phoneQuery = { phone: data.phone };
  if (excludeId) phoneQuery._id = { $ne: excludeId };

  const existingPhone = await Player.findOne(phoneQuery);
  if (existingPhone) {
    errors.push('Phone number is already registered');
  }

  return errors;
}

// Routes

// Serve the main registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'registration.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Get current sequence number (for admin/debugging)
app.get('/api/sequence', async (req, res) => {
  try {
    const counter = await Counter.findById('player_sequence');
    const currentSequence = counter ? counter.sequence_value : 0;

    res.json({
      success: true,
      currentSequence,
     nextPlayerId: (
    `idsc${String(currentSequence + 1).padStart(2, '0')}${new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '')}`
  ).toUpperCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sequence',
      error: error.message
    });
  }
});

// Player registration endpoint with NEW ID LOGIC
app.post('/api/players/register', async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      primarySport,
      role,
      battingOrderPreference,
      bowlingStyle,
      battingStyle,
      bowlingArm,
      username,
      password,
      clientTimestamp,
      clientRandom
    } = req.body;

    console.log('📝 Registration request received for:', firstName, lastName);

    // Validate required fields  .toUpperCase()
    const requiredFields = {
      firstName, lastName, dateOfBirth, gender, email, phone,
      streetAddress, city, state, postalCode, role,
      battingOrderPreference, battingStyle, username, password
    };

    const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate unique fields
    // const validationErrors = await validateUniqueFields({
    //   email,
    //   username,
    //   phone
    // });

    // if (validationErrors.length > 0) {
    //   console.log('❌ Validation errors:', validationErrors);
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Validation failed',
    //     errors: validationErrors
    //   });
    // }

    // Generate unique IDs with NEW LOGIC
    const { playerId, sequenceNumber } = await generateUniquePlayerId();
    const userId = await generateUniqueUserId({
      firstName,
      lastName,
      email,
      clientTimestamp,
      clientRandom
    });

    console.log(`🆔 Generated IDs - Player: ${playerId}, User: ${userId}, Sequence: ${sequenceNumber}`);

    // Create registration metadata
    const registrationMetadata = {
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      clientTimestamp: clientTimestamp || Date.now(),
      clientRandom: clientRandom || 'none'
    };

    // Create new player with unique IDs
    const newPlayer = new Player({
      playerId,
      userId,
      sequenceNumber,
      firstName,
      middleName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      streetAddress,
      city,
      state,
      postalCode,
      country: country || 'India',
      primarySport: primarySport || 'Cricket',
      role,
      battingOrderPreference,
      bowlingStyle,
      battingStyle,
      bowlingArm,
      username: username.trim(),
      password,
      registrationMetadata
    });

    // Save player to database
    const savedPlayer = await newPlayer.save();

    // Return success response (without password and sensitive data)
    const responseData = {
      success: true,
      message: 'Registration successful! Welcome to IDCS Cricket Community!',
      playerId: savedPlayer.playerId,
      userId: savedPlayer.userId,
      sequenceNumber: savedPlayer.sequenceNumber,
      fullName: savedPlayer.fullName,
      email: savedPlayer.email,
      phone: savedPlayer.phone,
      city: savedPlayer.city,
      state: savedPlayer.state,
      role: savedPlayer.role,
      registrationDate: savedPlayer.registrationDate,
      status: savedPlayer.status
    };

    // Log successful registration
    console.log(`✅ Player registered successfully: ${savedPlayer.playerId} - ${savedPlayer.fullName}`);

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Registration error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'playerId' ? 'Player ID' : 
                       field === 'userId' ? 'User ID' : 
                       field.charAt(0).toUpperCase() + field.slice(1);

      return res.status(400).json({
        success: false,
        message: `${fieldName} already exists. Please try again.`,
        field
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all players endpoint
app.get('/api/players', async (req, res) => {
  try {
    const { search, limit = 50, page = 1, role, state } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { playerId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (state) {
      query.state = state;
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Get players with pagination
    const players = await Player.find(query)
      .select('-password -registrationMetadata')
      .sort({ sequenceNumber: 1, registrationDate: -1 })
      .limit(limitNum)
      .skip(skip);

    // Get total count for pagination
    const totalCount = await Player.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      count: players.length,
      totalCount,
      totalPages,
      currentPage: parseInt(page),
      players
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching players'
    });
  }
});

// Get player by ID (Player ID or User ID)
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findOne({
      $or: [
        { playerId: req.params.id },
        { userId: req.params.id },
        { _id: req.params.id }
      ]
    }).select('-password -registrationMetadata');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching player'
    });
  }
});

// Get registration statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalPlayers = await Player.countDocuments();
    const activeUsers = await Player.countDocuments({ status: 'Active' });

    const currentSequence = await Counter.findById('player_sequence');
    const nextSequenceNumber = currentSequence ? currentSequence.sequence_value + 1 : 1;

    const roleStats = await Player.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stateStats = await Player.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentRegistrations = await Player.aggregate([
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$registrationDate' 
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    // Get today's date in ddmmyyyy format for next Player ID preview
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}${month}${year}`;
    const nextPlayerId = `idsc${String(nextSequenceNumber).padStart(2, '0')}${dateStr}`;

    res.json({
      success: true,
      stats: {
        totalPlayers,
        activeUsers,
        currentSequence: currentSequence ? currentSequence.sequence_value : 0,
        nextSequenceNumber,
        nextPlayerId,
        roles: roleStats,
        topStates: stateStats,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log('\n🏏 IDCS Cricket Registration Server - NEW ID SYSTEM');
    console.log('===================================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Registration form: http://localhost:${PORT}`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/players/register`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Statistics: http://localhost:${PORT}/api/stats`);
    console.log(`🔢 Sequence check: http://localhost:${PORT}/api/sequence`);
    console.log('===================================================');
    console.log('🆔 Player ID Format: idsc + sequence + ddmmyyyy');
    console.log('📅 Example: idsc0104102025, idsc0204102025, idsc0304102025');
    console.log('===================================================\n');
});

module.exports = app;

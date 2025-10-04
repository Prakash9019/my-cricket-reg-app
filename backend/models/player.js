import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Counter schema for generating sequential IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const playerSchema = new mongoose.Schema({
  // Unique Identifiers - Updated Logic
  playerId: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: idsc + sequential number + ddmmyyyy
    // Example: idsc0104102025, idsc0204102025, etc.
  },
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Sequential number for this player (for reference)
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
    unique: true,
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
    unique: true,
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
    required: true,
    enum: ['Batsman', 'Bowler', 'All Rounder', 'Keeper Batsman'],
    index: true
  },
  battingOrderPreference: {
    type: String,
    required: true,
    enum: ['Opening', 'Top Order', 'Middle Order', 'Lower Order']
  },
  bowlingStyle: {
    type: String,
    enum: ['Fast', 'Medium', 'Spin', 'None'],
    default: 'None'
  },
  battingStyle: {
    type: String,
    required: true,
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
    unique: true,
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

// Static method to get next sequence number and generate Player ID
playerSchema.statics.getNextSequence = async function() {
  const counter = await Counter.findByIdAndUpdate(
    'player_sequence',
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// Static method to generate unique Player ID with new logic
playerSchema.statics.generatePlayerId = async function() {
  try {
    const sequenceNumber = await this.getNextSequence();

    // Get current date in ddmmyyyy format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}${month}${year}`;

    // Format sequence number with leading zeros (2 digits minimum)
    const seqStr = String(sequenceNumber).padStart(2, '0');

    // Create Player ID: idsc + sequence + ddmmyyyy
    const playerId = `idsc${seqStr}${dateStr}`;

    return { playerId, sequenceNumber };
  } catch (error) {
    throw new Error('Failed to generate Player ID: ' + error.message);
  }
};

// Static method to generate User ID (keeping existing logic)
playerSchema.statics.generateUserId = async function(userData) {
  let userId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    userId = `USER_${timestamp}_${random}`.toUpperCase();

    const existingUser = await this.findOne({ userId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique User ID');
  }

  return userId;
};

export { Counter };
export default mongoose.models.Player || mongoose.model('Player', playerSchema);
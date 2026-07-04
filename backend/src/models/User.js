const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    role: {
      type: String,
      enum: ['student', 'admin', 'trainer', 'hr', 'super_admin'],
      default: 'student',
    },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    googleId: { type: String, default: null },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralEarnings: { type: Number, default: 0 },
    profileCompletion: { type: Number, default: 0 },
    bio: { type: String, maxlength: 500 },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startYear: Number,
        endYear: Number,
        grade: String,
      },
    ],
    skills: [String],
    socialLinks: {
      github: String,
      linkedin: String,
      portfolio: String,
      twitter: String,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.methods.generateReferralCode = function () {
  const code = `CCT${this._id.toString().slice(-6).toUpperCase()}`;
  this.referralCode = code;
  return code;
};

// Calculate profile completion
userSchema.methods.calculateProfileCompletion = function () {
  const fields = ['firstName', 'lastName', 'email', 'phone', 'avatar', 'bio'];
  const completed = fields.filter((f) => this[f]).length;
  this.profileCompletion = Math.round((completed / fields.length) * 100);
  return this.profileCompletion;
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

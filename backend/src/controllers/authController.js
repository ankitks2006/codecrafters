const User = require('../models/User');
const axios = require('axios');
const { generateTokens, generateOTP, generateResetToken, hashToken, verifyRefreshToken } = require('../services/tokenService');
const emailService = require('../services/emailService');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, referralCode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.error(res, 'Email already registered. Please login.', 409);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      otp,
      otpExpiry,
      referredBy: referredByUser?._id,
    });

    user.generateReferralCode();
    await user.save({ validateBeforeSave: false });

    await emailService.sendOTP(email, firstName, otp);

    return ApiResponse.created(res, { email: user.email }, 'Registration successful. Please verify your email with the OTP sent.');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) return ApiResponse.notFound(res, 'User not found');
    if (user.isEmailVerified) return ApiResponse.error(res, 'Email already verified', 400);
    if (!user.otp || user.otp !== otp) return ApiResponse.error(res, 'Invalid OTP', 400);
    if (user.otpExpiry < new Date()) return ApiResponse.error(res, 'OTP has expired. Please request a new one.', 400);

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    await emailService.sendWelcome(user.email, user.firstName).catch(() => {});

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    }, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) return ApiResponse.notFound(res, 'User not found');
    if (user.isEmailVerified) return ApiResponse.error(res, 'Email already verified', 400);

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendOTP(email, user.firstName, otp);
    return ApiResponse.success(res, null, 'OTP resent successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) return ApiResponse.unauthorized(res, 'Invalid email or password');
    if (!user.isEmailVerified) return ApiResponse.error(res, 'Please verify your email first', 403);
    if (!user.isActive) return ApiResponse.error(res, 'Your account has been deactivated. Contact support.', 403);
    if (user.isBlocked) return ApiResponse.forbidden(res, 'Your account has been blocked. Contact support.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return ApiResponse.unauthorized(res, 'Invalid email or password');

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return ApiResponse.unauthorized(res, 'Refresh token required');

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, tokens, 'Token refreshed');
  } catch (error) {
    if (error.name === 'TokenExpiredError') return ApiResponse.unauthorized(res, 'Refresh token expired. Please login again.');
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null }, { validateBeforeSave: false });
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.');

    const resetToken = generateResetToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await emailService.sendPasswordReset(email, user.firstName, resetLink);

    return ApiResponse.success(res, null, 'Password reset link sent to your email.');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) return ApiResponse.error(res, 'Invalid or expired reset token', 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return ApiResponse.success(res, null, 'Password reset successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'firstName lastName email')
      .lean();
    return ApiResponse.success(res, sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Redirect to Google OAuth consent
// @route   GET /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(url);
  } catch (error) { next(error); }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) return ApiResponse.error(res, 'Missing code from Google', 400);

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenRes.data.access_token;
    const idToken = tokenRes.data.id_token;

    // Get user info
    const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const info = userInfoRes.data;

    // Find or create user
    let user = await User.findOne({ email: info.email });
    if (!user) {
      user = await User.create({
        firstName: info.given_name || info.name || 'User',
        lastName: info.family_name || '',
        email: info.email,
        isEmailVerified: true,
        googleId: info.id,
      });
      user.generateReferralCode?.();
      await user.save({ validateBeforeSave: false });
    } else {
      // update googleId if missing
      if (!user.googleId) {
        user.googleId = info.id;
        await user.save({ validateBeforeSave: false });
      }
    }

    // Generate tokens and persist refresh token
    const { accessToken: jwtAccess, refreshToken: jwtRefresh } = generateTokens(user);
    user.refreshToken = jwtRefresh;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });

    // Redirect back to frontend with tokens
    const frontend = process.env.FRONTEND_URL || `${req.protocol}://${req.headers.host}`;
    const redirect = `${frontend}/?accessToken=${jwtAccess}&refreshToken=${jwtRefresh}`;
    return res.redirect(redirect);
  } catch (error) {
    logger.error('Google OAuth callback failed:', error?.message || error);
    return ApiResponse.error(res, 'Google authentication failed', 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return ApiResponse.error(res, 'Current password is incorrect', 400);

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.refreshToken;
  return obj;
};

const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');
    if (!user) return ApiResponse.unauthorized(res, 'User not found');
    if (!user.isActive) return ApiResponse.unauthorized(res, 'Account is deactivated');
    if (user.isBlocked) return ApiResponse.forbidden(res, 'Account has been blocked');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid access token');
    }
    logger.error('Auth middleware error:', error);
    return ApiResponse.error(res, 'Authentication failed', 500);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (user?.isActive && !user?.isBlocked) req.user = user;
    }
    next();
  } catch {
    next(); // continue without auth
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return ApiResponse.unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `Role '${req.user.role}' is not authorized for this action`);
    }
    next();
  };
};

const isAdmin = authorize('admin', 'super_admin');
const isSuperAdmin = authorize('super_admin');
const isTrainer = authorize('admin', 'super_admin', 'trainer');
const isHR = authorize('admin', 'super_admin', 'hr');

module.exports = { authenticate, optionalAuth, authorize, isAdmin, isSuperAdmin, isTrainer, isHR };

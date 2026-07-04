const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { authenticate } = require('../middleware/auth');
const { uploadToCloudinaryBuffer } = require('../middleware/upload');
const { deleteFromCloudinary } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Get profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -refreshToken').populate('referredBy', 'firstName lastName');
    return ApiResponse.success(res, user);
  } catch (e) { next(e); }
});

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'bio', 'address', 'education', 'skills', 'socialLinks', 'notificationPreferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -refreshToken');
    user.calculateProfileCompletion();
    await user.save({ validateBeforeSave: false });
    return ApiResponse.success(res, user, 'Profile updated');
  } catch (e) { next(e); }
});

// Upload avatar
router.put('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return ApiResponse.error(res, 'No image provided', 400);
    const user = await User.findById(req.user._id);
    if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId).catch(() => {});
    const result = await uploadToCloudinaryBuffer(req.file.buffer, 'avatars', {
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    });
    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    user.calculateProfileCompletion();
    await user.save({ validateBeforeSave: false });
    return ApiResponse.success(res, { avatar: user.avatar }, 'Avatar updated');
  } catch (e) { next(e); }
});

// Get dashboard stats
router.get('/dashboard-stats', authenticate, async (req, res, next) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const Certificate = require('../models/Certificate');
    const { SupportTicket } = require('../models/index');
    const { Assignment, AssignmentSubmission } = require('../models/Assignment');

    const [courseEnrollments, internshipEnrollments, certificates, tickets, pendingAssignments] = await Promise.all([
      Enrollment.find({ student: req.user._id, type: 'course', status: { $in: ['active', 'completed'] } }).populate('course', 'title thumbnail progress'),
      Enrollment.find({ student: req.user._id, type: 'internship', status: { $in: ['active', 'completed'] } }).populate('internship', 'title thumbnail'),
      Certificate.countDocuments({ student: req.user._id, status: 'active' }),
      SupportTicket.countDocuments({ student: req.user._id, status: { $in: ['open', 'in_progress'] } }),
      AssignmentSubmission.countDocuments({ student: req.user._id, status: 'submitted' }),
    ]);

    const avgProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((acc, e) => acc + e.progress, 0) / courseEnrollments.length)
      : 0;

    return ApiResponse.success(res, {
      totalCourses: courseEnrollments.length,
      totalInternships: internshipEnrollments.length,
      totalCertificates: certificates,
      openTickets: tickets,
      pendingAssignments,
      avgProgress,
      recentCourses: courseEnrollments.slice(0, 3),
    });
  } catch (e) { next(e); }
});

// Referral info
router.get('/referral', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralEarnings');
    const referredUsers = await User.find({ referredBy: req.user._id }).select('firstName lastName createdAt').sort('-createdAt');
    return ApiResponse.success(res, {
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      referredUsers,
      totalReferrals: referredUsers.length,
    });
  } catch (e) { next(e); }
});

// Get public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('firstName lastName avatar bio skills socialLinks role createdAt');
    if (!user) return ApiResponse.notFound(res, 'User not found');
    return ApiResponse.success(res, user);
  } catch (e) { next(e); }
});

module.exports = router;

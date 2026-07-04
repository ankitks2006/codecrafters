const User = require('../models/User');
const Course = require('../models/Course');
const Internship = require('../models/Internship');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const { SupportTicket, Notification, Blog } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');

// @desc    Admin dashboard overview
// @route   GET /api/admin/analytics/overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers, newUsersThisMonth, newUsersPrevMonth,
      totalCourses, publishedCourses,
      totalInternships,
      totalEnrollments, enrollmentsThisMonth,
      totalRevenue, revenueThisMonth, revenuePrevMonth,
      totalCertificates,
      openTickets,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Internship.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: null, total: { $sum: '$amountInRupees' } } }]),
      Payment.aggregate([{ $match: { status: 'captured', paidAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amountInRupees' } } }]),
      Payment.aggregate([{ $match: { status: 'captured', paidAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } }, { $group: { _id: null, total: { $sum: '$amountInRupees' } } }]),
      Certificate.countDocuments({ status: 'active' }),
      SupportTicket.countDocuments({ status: 'open' }),
    ]);

    const totalRev = totalRevenue[0]?.total || 0;
    const thisMonthRev = revenueThisMonth[0]?.total || 0;
    const prevMonthRev = revenuePrevMonth[0]?.total || 0;
    const revenueGrowth = prevMonthRev > 0 ? (((thisMonthRev - prevMonthRev) / prevMonthRev) * 100).toFixed(1) : 100;
    const userGrowth = newUsersPrevMonth > 0 ? (((newUsersThisMonth - newUsersPrevMonth) / newUsersPrevMonth) * 100).toFixed(1) : 100;

    return ApiResponse.success(res, {
      users: { total: totalUsers, thisMonth: newUsersThisMonth, growth: userGrowth },
      courses: { total: totalCourses, published: publishedCourses },
      internships: { total: totalInternships },
      enrollments: { total: totalEnrollments, thisMonth: enrollmentsThisMonth },
      revenue: { total: totalRev, thisMonth: thisMonthRev, prevMonth: prevMonthRev, growth: revenueGrowth },
      certificates: { total: totalCertificates },
      openTickets,
    });
  } catch (error) { next(error); }
};

// @desc    Revenue analytics
// @route   GET /api/admin/analytics/revenue
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = '12' } = req.query; // months
    const months = parseInt(period);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const revenueData = await Payment.aggregate([
      { $match: { status: 'captured', paidAt: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          revenue: { $sum: '$amountInRupees' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const courseRevenue = await Payment.aggregate([
      { $match: { status: 'captured', type: 'course' } },
      { $group: { _id: '$course', revenue: { $sum: '$amountInRupees' }, count: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { title: '$course.title', revenue: 1, count: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    return ApiResponse.success(res, { monthly: revenueData, topCourses: courseRevenue });
  } catch (error) { next(error); }
};

// @desc    User growth analytics
// @route   GET /api/admin/analytics/users
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userGrowth = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find({ role: 'student' })
      .select('firstName lastName email createdAt avatar isEmailVerified')
      .sort('-createdAt')
      .limit(10);

    return ApiResponse.success(res, { growth: userGrowth, roles: roleDistribution, recent: recentUsers });
  } catch (error) { next(error); }
};

// @desc    Manage users - get all
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive, isBlocked } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
    if (search) query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry -refreshToken')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(res, users, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
exports.toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');
    if (user.role === 'super_admin') return ApiResponse.forbidden(res, 'Cannot block super admin');
    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });
    return ApiResponse.success(res, null, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`);
  } catch (error) { next(error); }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['student', 'trainer', 'hr', 'admin'];
    if (!allowedRoles.includes(role)) return ApiResponse.error(res, 'Invalid role', 400);

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return ApiResponse.notFound(res, 'User not found');
    return ApiResponse.success(res, user, 'Role updated');
  } catch (error) { next(error); }
};

// @desc    Send bulk email
// @route   POST /api/admin/users/bulk-email
exports.sendBulkEmail = async (req, res, next) => {
  try {
    const { userIds, subject, message, role } = req.body;
    let users;
    if (userIds?.length) {
      users = await User.find({ _id: { $in: userIds } }).select('email firstName');
    } else if (role) {
      users = await User.find({ role }).select('email firstName');
    } else {
      return ApiResponse.error(res, 'Specify userIds or role', 400);
    }

    const emailService = require('../services/emailService');
    const sendPromises = users.map(u => emailService.sendEmail?.({ to: u.email, subject, html: `<p>Dear ${u.firstName},</p>${message}` }).catch(() => {}));
    await Promise.allSettled(sendPromises);

    return ApiResponse.success(res, { sent: users.length }, `Bulk email queued for ${users.length} users`);
  } catch (error) { next(error); }
};

// @desc    System health check
// @route   GET /api/admin/system/health
exports.getSystemHealth = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const memUsage = process.memoryUsage();
    return ApiResponse.success(res, {
      status: 'healthy',
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) { next(error); }
};

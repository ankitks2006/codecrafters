// enrollments.js
const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Internship = require('../models/Internship');
const { certificateService } = require('../services/certificateService');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isAdmin, isTrainer } = require('../middleware/auth');

// Get my enrollments
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const query = { student: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;
    const enrollments = await Enrollment.find(query)
      .populate('course', 'title thumbnail slug duration level instructor')
      .populate('internship', 'title thumbnail slug duration')
      .populate({ path: 'course', populate: { path: 'instructor', select: 'firstName lastName avatar' } })
      .sort('-enrolledAt');
    return ApiResponse.success(res, enrollments);
  } catch (e) { next(e); }
});

// Free enrollment (for free courses)
router.post('/enroll-free', authenticate, async (req, res, next) => {
  try {
    const { type, itemId } = req.body;
    let item;
    if (type === 'course') {
      item = await Course.findById(itemId);
      if (!item) return ApiResponse.notFound(res, 'Course not found');
      if ((item.discountPrice > 0 ? item.discountPrice : item.price) > 0) {
        return ApiResponse.error(res, 'This is a paid course. Please complete payment.', 400);
      }
    } else {
      item = await Internship.findById(itemId);
      if (!item) return ApiResponse.notFound(res, 'Internship not found');
    }

    const query = { student: req.user._id, type };
    query[type] = itemId;
    console.log('Enrollment query:', query);
    console.log('Enrollment type:', type);
    const existing = await Enrollment.findOne(query);
    let enrollment;
    console.log("Existing enrollment: ", existing);
    if (existing) {
      
      if (!['expired', 'refunded'].includes(existing.status)) {
        console.log("Enrollment already exists and is active or completed.");
        return ApiResponse.error(res, 'Already enrolled', 409);
      }
      existing.status = 'active';
      existing.enrolledAt = new Date();
      existing.progress = 0;
      existing.completedAt = undefined;
      existing.certificateIssued = false;
      existing.certificate = undefined;
      if (type === 'internship') existing.internshipStatus = 'enrolled';
      existing.payment = undefined;
      enrollment = await existing.save();
    } else {
      enrollment = await Enrollment.create({ student: req.user._id, type, [type]: itemId });
      await (type === 'course' ? Course : Internship).findByIdAndUpdate(itemId, { $inc: { enrollmentCount: 1 } });
    }

    return ApiResponse.created(res, enrollment, 'Enrolled successfully');
  } catch (e) {
    console.error("Enrollment error:", e);
     next(e); }
});

// Get enrollment details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course').populate('internship').populate('certificate');
    if (!enrollment) return ApiResponse.notFound(res, 'Enrollment not found');
    if (enrollment.student.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
      return ApiResponse.forbidden(res);
    }
    return ApiResponse.success(res, enrollment);
  } catch (e) { next(e); }
});

// Complete enrollment & trigger certificate
router.put('/:id/complete', authenticate, isTrainer, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student').populate('course').populate('internship');
    if (!enrollment) return ApiResponse.notFound(res, 'Enrollment not found');
    if (enrollment.certificateIssued) return ApiResponse.error(res, 'Certificate already issued', 409);

    enrollment.status = 'completed';
    enrollment.progress = 100;
    enrollment.completedAt = new Date();

    let instructor = null;
    if (enrollment.course) {
      const course = await Course.findById(enrollment.course._id).populate('instructor', 'firstName lastName');
      instructor = course?.instructor;
    }

    const cert = await certificateService.generate({
      student: enrollment.student,
      type: enrollment.type,
      course: enrollment.course,
      internship: enrollment.internship,
      enrollment,
      instructor,
    });

    enrollment.certificateIssued = true;
    enrollment.certificate = cert._id;
    if (enrollment.type === 'internship') {
      enrollment.internshipStatus = 'completed';
    }
    await enrollment.save();

    return ApiResponse.success(res, { enrollment, certificate: cert }, 'Enrollment completed and certificate issued');
  } catch (e) { next(e); }
});

// Admin: all enrollments
router.get('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, student } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (student) query.student = student;
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('student', 'firstName lastName email')
        .populate('course', 'title').populate('internship', 'title')
        .sort('-enrolledAt').skip(skip).limit(Number(limit)),
      Enrollment.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, enrollments, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

module.exports = router;

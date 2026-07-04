// internships.js
const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 9, search, status, type } = req.query;
    const query = { isPublished: true };
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) query.$text = { $search: search };
    const skip = (page - 1) * limit;
    const internships = await Internship.find(query)
      .populate('mentor category', 'firstName lastName name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await Internship.countDocuments(query);

    if (req.user && internships.length) {
      const internshipIds = internships.map(i => i._id);
      const activeEnrollments = await Enrollment.find({
        student: req.user._id,
        type: 'internship',
        status: { $in: ['active', 'completed'] },
        internship: { $in: internshipIds },
      }).select('internship');
      const enrolledInternshipIds = new Set(activeEnrollments.map(e => e.internship.toString()));
      internships.forEach(i => {
        i.isEnrolled = enrolledInternshipIds.has(i._id.toString());
      });
    }

    return ApiResponse.paginated(res, internships, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const internship = await Internship.findOne({ slug: req.params.slug, isPublished: true }).populate('mentor category', 'firstName lastName name bio avatar');
    if (!internship) return ApiResponse.notFound(res, 'Internship not found');
    let isEnrolled = false;
    if (req.user) {
      const e = await Enrollment.findOne({
        student: req.user._id,
        internship: internship._id,
        status: { $in: ['active', 'completed'] },
      });
      isEnrolled = !!e;
    }
    return ApiResponse.success(res, { ...internship.toObject(), isEnrolled });
  } catch (e) { next(e); }
});

router.post('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const internship = await Internship.create({ ...req.body });
    return ApiResponse.created(res, internship);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const updated = await Internship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return ApiResponse.notFound(res, 'Internship not found');
    return ApiResponse.success(res, updated, 'Internship updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await Internship.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Internship deleted');
  } catch (e) { next(e); }
});

// Weekly report submission
router.post('/:id/weekly-report', authenticate, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, internship: req.params.id });
    if (!enrollment) return ApiResponse.forbidden(res, 'Not enrolled');
    enrollment.weeklyReports.push({ week: req.body.week, report: req.body.report, submittedAt: new Date() });
    await enrollment.save();
    return ApiResponse.success(res, null, 'Weekly report submitted');
  } catch (e) { next(e); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Assignment, AssignmentSubmission } = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isAdmin, isTrainer } = require('../middleware/auth');
const { assignmentUpload, uploadToCloudinaryBuffer } = require('../middleware/upload');

// Get assignments for student
router.get('/my', authenticate, async (req, res, next) => {
  try {
    // const enrollments = await Enrollment.find({ student: req.user._id, status: { $in: ['active', 'completed'] } });
     const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' });
    const courseIds = enrollments.filter(e => e.course).map(e => e.course);
    const internshipIds = enrollments.filter(e => e.internship).map(e => e.internship);
    const assignments = await Assignment.find({
      $or: [{ course: { $in: courseIds } }, { internship: { $in: internshipIds } }],
      isPublished: true,
    }).populate('course', 'title').populate('internship', 'title').sort('-deadline');
    return ApiResponse.success(res, assignments);
  } catch (e) { next(e); }
});

// Get assignments created by the current trainer/admin (for management UI).
// Distinct from /my above, which is the student-facing "what's assigned to me" view.
router.get('/created/mine', authenticate, isTrainer, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const query = { createdBy: req.user._id };
    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate('course', 'title')
        .populate('internship', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Assignment.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, assignments, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// Get single assignment
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title').populate('internship', 'title').populate('createdBy', 'firstName lastName');
    if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');
    const submission = await AssignmentSubmission.findOne({ assignment: req.params.id, student: req.user._id });
    return ApiResponse.success(res, { assignment, submission });
  } catch (e) { next(e); }
});

// Create assignment (trainer/admin)
router.post('/', authenticate, isTrainer, async (req, res, next) => {
  try {
    const assignment = await Assignment.create({ ...req.body, createdBy: req.user._id });
    return ApiResponse.created(res, assignment, 'Assignment created');
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, isTrainer, async (req, res, next) => {
  try {
    const a = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return ApiResponse.notFound(res, 'Assignment not found');
    return ApiResponse.success(res, a, 'Assignment updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Assignment deleted');
  } catch (e) { next(e); }
});

// Submit assignment
router.post('/:id/submit', authenticate, assignmentUpload.array('files', 5), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return ApiResponse.notFound(res, 'Assignment not found');

    const existing = await AssignmentSubmission.findOne({ assignment: req.params.id, student: req.user._id });
    if (existing) return ApiResponse.error(res, 'You have already submitted this assignment', 409);

    const isLate = new Date() > assignment.deadline;
    if (isLate && !assignment.allowLateSubmission) {
      return ApiResponse.error(res, 'Submission deadline has passed', 400);
    }

    // Upload files to Cloudinary
    const uploadedFiles = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinaryBuffer(file.buffer, 'assignments', {
          resource_type: 'raw',
          public_id: `${req.user._id}_${assignment._id}_${Date.now()}_${file.originalname}`,
        });
        uploadedFiles.push({
          originalName: file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
          mimeType: file.mimetype,
        });
      }
    }

    const submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.user._id,
      files: uploadedFiles,
      links: req.body.links ? JSON.parse(req.body.links) : [],
      textAnswer: req.body.textAnswer,
      isLate,
    });

    await Assignment.findByIdAndUpdate(req.params.id, { $inc: { totalSubmissions: 1 } });

    return ApiResponse.created(res, submission, isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully');
  } catch (e) { next(e); }
});

// Grade submission (trainer/admin)
router.put('/submissions/:id/grade', authenticate, isTrainer, async (req, res, next) => {
  try {
    const { marks, remarks, grade } = req.body;
    const submission = await AssignmentSubmission.findByIdAndUpdate(
      req.params.id,
      { marks, remarks, grade, status: 'graded', gradedBy: req.user._id, gradedAt: new Date() },
      { new: true }
    ).populate('student', 'firstName lastName email');
    if (!submission) return ApiResponse.notFound(res, 'Submission not found');

    // Notify student
    const { Notification } = require('../models/index');
    await Notification.create({
      recipient: submission.student._id,
      title: 'Assignment Graded',
      message: `Your assignment has been graded. Marks: ${marks}`,
      type: 'assignment',
    });

    return ApiResponse.success(res, submission, 'Assignment graded');
  } catch (e) { next(e); }
});

// Get all submissions for an assignment (trainer/admin)
router.get('/:id/submissions', authenticate, isTrainer, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { assignment: req.params.id };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(query).populate('student', 'firstName lastName email avatar').sort('-submittedAt').skip(skip).limit(Number(limit)),
      AssignmentSubmission.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, submissions, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

module.exports = router;

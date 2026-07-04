const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { Review, Notification } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinaryBuffer } = require('../middleware/upload');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { certificateService } = require('../services/certificateService');
const logger = require('../utils/logger');

// @desc    Get all categories (public)
// @route   GET /api/courses/categories
exports.getPublicCategories = async (req, res, next) => {
  try {
    const { Category } = require('../models/index');
    const cats = await Category.find().sort('order name');
    return ApiResponse.success(res, cats);
  } catch (error) { next(error); }
};

// @desc    Get all courses (public)
// @route   GET /api/courses
exports.getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, level, minPrice, maxPrice,
      search, sort = '-createdAt', isFeatured, language,
    } = req.query;

    const query = { isPublished: true, status: 'published' };
    if (category) query.category = category;
    if (level) query.level = level;
    if (language) query.language = language;
    if (isFeatured) query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('category', 'name slug')
      .populate('instructor', 'firstName lastName avatar')
      .select('-modules')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (req.user && courses.length) {
      const courseIds = courses.map(course => course._id);
      const activeEnrollments = await Enrollment.find({
        student: req.user._id,
        type: 'course',
        status: { $in: ['active', 'completed'] },
        course: { $in: courseIds },
      }).select('course');
      const enrolledCourseIds = new Set(activeEnrollments.map(e => e.course.toString()));
      courses.forEach(course => {
        course.isEnrolled = enrolledCourseIds.has(course._id.toString());
      });
    }

    return ApiResponse.paginated(res, courses, {
      page: Number(page), limit: Number(limit), total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) { next(error); }
};

// @desc    Get single course
// @route   GET /api/courses/:slug
exports.getCourse = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug, isPublished: true })
      .populate('category', 'name slug')
      .populate('instructor', 'firstName lastName avatar bio socialLinks')
      .lean();

    if (!course) return ApiResponse.notFound(res, 'Course not found');

    // Check if enrolled (if authenticated)
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
        status: { $in: ['active', 'completed'] },
      });
      isEnrolled = !!enrollment;
    }

    // Hide video URLs if not enrolled (only free lessons visible)
    if (!isEnrolled && !['admin', 'super_admin', 'trainer'].includes(req.user?.role)) {
      course.modules = course.modules?.map((mod) => ({
        ...mod,
        lessons: mod.lessons?.map((lesson) => ({
          ...lesson,
          videoUrl: lesson.isFree ? lesson.videoUrl : null,
          notes: lesson.isFree ? lesson.notes : null,
        })),
      }));
    }

    const reviews = await Review.find({ course: course._id, isPublished: true })
      .populate('student', 'firstName lastName avatar')
      .sort('-createdAt')
      .limit(10)
      .lean();

    return ApiResponse.success(res, { ...course, isEnrolled, reviews });
  } catch (error) { next(error); }
};

// @desc    Create course (Admin/Trainer)
// @route   POST /api/courses
exports.createCourse = async (req, res, next) => {
  try {
    const courseData = { ...req.body, instructor: req.user._id };
    const published = courseData.isPublished === 'true' || courseData.isPublished === true || courseData.isPublished === 'on';
    courseData.isPublished = published;
    courseData.status = published ? 'published' : 'draft';

    // Handle thumbnail upload
    if (req.files?.thumbnail?.[0]) {
      const result = await uploadToCloudinaryBuffer(req.files.thumbnail[0].buffer, 'courses/thumbnails', { transformation: [{ width: 800, height: 450, crop: 'fill' }] });
      courseData.thumbnail = result.secure_url;
      courseData.thumbnailPublicId = result.public_id;
    }
    if (req.files?.banner?.[0]) {
      const result = await uploadToCloudinaryBuffer(req.files.banner[0].buffer, 'courses/banners');
      courseData.banner = result.secure_url;
      courseData.bannerPublicId = result.public_id;
    }

    const course = await Course.create(courseData);
    await course.populate('category instructor', 'name firstName lastName');
    return ApiResponse.created(res, course, 'Course created successfully');
  } catch (error) { next(error); }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return ApiResponse.notFound(res, 'Course not found');

    // Only instructor or admin can update
    if (req.user.role === 'trainer' && course.instructor.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized to update this course');
    }

    const updateData = { ...req.body };
    if (updateData.isPublished !== undefined) {
      const published = updateData.isPublished === 'true' || updateData.isPublished === true || updateData.isPublished === 'on';
      updateData.isPublished = published;
      updateData.status = published ? 'published' : 'draft';
    }

    if (req.files?.thumbnail?.[0]) {
      if (course.thumbnailPublicId) await deleteFromCloudinary(course.thumbnailPublicId).catch(() => {});
      const result = await uploadToCloudinaryBuffer(req.files.thumbnail[0].buffer, 'courses/thumbnails', { transformation: [{ width: 800, height: 450, crop: 'fill' }] });
      updateData.thumbnail = result.secure_url;
      updateData.thumbnailPublicId = result.public_id;
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('category instructor', 'name firstName lastName');

    return ApiResponse.success(res, updated, 'Course updated successfully');
  } catch (error) { next(error); }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return ApiResponse.notFound(res, 'Course not found');

    const enrollmentCount = await Enrollment.countDocuments({ course: course._id, status: 'active' });
    if (enrollmentCount > 0) {
      return ApiResponse.error(res, `Cannot delete course with ${enrollmentCount} active enrollments`, 400);
    }

    if (course.thumbnailPublicId) await deleteFromCloudinary(course.thumbnailPublicId).catch(() => {});
    if (course.bannerPublicId) await deleteFromCloudinary(course.bannerPublicId).catch(() => {});

    await Course.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Course deleted successfully');
  } catch (error) { next(error); }
};

// @desc    Add module to course
// @route   POST /api/courses/:id/modules
exports.addModule = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return ApiResponse.notFound(res, 'Course not found');
    course.modules.push({ ...req.body, order: course.modules.length });
    await course.save();
    return ApiResponse.success(res, course.modules[course.modules.length - 1], 'Module added');
  } catch (error) { next(error); }
};

// @desc    Add lesson to module
// @route   POST /api/courses/:id/modules/:moduleId/lessons
exports.addLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return ApiResponse.notFound(res, 'Course not found');
    const module = course.modules.id(req.params.moduleId);
    if (!module) return ApiResponse.notFound(res, 'Module not found');

    const lessonData = { ...req.body };

    // Upload notes PDF if present
    if (req.files?.notes?.[0]) {
      const result = await uploadToCloudinaryBuffer(req.files.notes[0].buffer, 'courses/notes', { resource_type: 'raw', format: 'pdf' });
      lessonData.notesUrl = result.secure_url;
    }

    module.lessons.push({ ...lessonData, order: module.lessons.length });
    await course.save();
    return ApiResponse.success(res, module.lessons[module.lessons.length - 1], 'Lesson added');
  } catch (error) { next(error); }
};

// @desc    Update lesson progress
// @route   POST /api/courses/:id/progress
exports.updateProgress = async (req, res, next) => {
  try {
    const { lessonId, moduleId, completed, watchedSeconds } = req.body;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id, status: 'active' });
    if (!enrollment) return ApiResponse.forbidden(res, 'Not enrolled in this course');

    const existing = enrollment.lessonProgress.find(p => p.lessonId.toString() === lessonId);
    if (existing) {
      if (completed !== undefined) existing.completed = completed;
      if (completed && !existing.completedAt) existing.completedAt = new Date();
      if (watchedSeconds) existing.watchedSeconds = Math.max(existing.watchedSeconds, watchedSeconds);
    } else {
      enrollment.lessonProgress.push({ lessonId, moduleId, completed: completed || false, watchedSeconds: watchedSeconds || 0, ...(completed && { completedAt: new Date() }) });
    }

    const course = await Course.findById(req.params.id).select('modules title duration hasCertificate instructor').populate('instructor', 'firstName lastName');
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = enrollment.lessonProgress.filter(p => p.completed).length;
    enrollment.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    enrollment.lastAccessedAt = new Date();

    let certificateGenerated = false;
    const justCompleted = enrollment.progress === 100 && !enrollment.completedAt;

    if (justCompleted) {
      enrollment.completedAt = new Date();
      enrollment.status = 'completed';
    }

    await enrollment.save();

    // Auto-generate certificate at 100% completion, outside the save so a
    // certificate-generation failure (e.g. Cloudinary hiccup) never blocks
    // the student's progress update from being saved.
    if (justCompleted && course.hasCertificate && !enrollment.certificateIssued) {
      try {
        const cert = await certificateService.generate({
          student: req.user,
          type: 'course',
          course,
          internship: null,
          enrollment,
          instructor: course.instructor,
        });
        enrollment.certificateIssued = true;
        enrollment.certificate = cert._id;
        await enrollment.save();
        certificateGenerated = true;

        await Course.findByIdAndUpdate(course._id, { $inc: { completionCount: 1 } });

        await Notification.create({
          recipient: req.user._id,
          title: '🎓 Course Completed!',
          message: `Congratulations! You completed "${course.title}" and earned a certificate.`,
          type: 'certificate',
          link: '/dashboard/certificates',
        });
      } catch (certError) {
        // Don't fail the whole request if certificate generation has an issue;
        // log it so an admin can manually regenerate via POST /certificates/generate.
        logger.error(`Auto certificate generation failed for enrollment ${enrollment._id}: ${certError.message}`);
      }
    }

    return ApiResponse.success(res, {
      progress: enrollment.progress,
      completed: enrollment.progress === 100,
      certificateGenerated,
    });
  } catch (error) { next(error); }
};

// @desc    Get single course by ID for admin/trainer editing (full data, no enrollment required)
// @route   GET /api/courses/admin/:id
exports.getCourseForAdmin = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('instructor', 'firstName lastName avatar');
    if (!course) return ApiResponse.notFound(res, 'Course not found');

    if (req.user.role === 'trainer' && course.instructor._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized to edit this course');
    }

    return ApiResponse.success(res, course);
  } catch (error) { next(error); }
};

// @desc    Get enrolled course content (authenticated)
// @route   GET /api/courses/:id/content
exports.getCourseContent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'firstName lastName avatar');
    if (!course) return ApiResponse.notFound(res, 'Course not found');

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id, status: { $in: ['active', 'completed'] } });
    if (!enrollment) return ApiResponse.forbidden(res, 'Purchase this course to access content');

    return ApiResponse.success(res, { course, enrollment });
  } catch (error) { next(error); }
};

// @desc    Submit review
// @route   POST /api/courses/:id/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return ApiResponse.forbidden(res, 'You must enroll in this course to leave a review');

    const existingReview = await Review.findOne({ student: req.user._id, course: req.params.id });
    if (existingReview) return ApiResponse.error(res, 'You have already reviewed this course', 409);

    const newReview = await Review.create({ student: req.user._id, course: req.params.id, rating, review });

    // Update course rating
    const reviews = await Review.find({ course: req.params.id, isPublished: true });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Course.findByIdAndUpdate(req.params.id, { rating: avgRating.toFixed(1), reviewCount: reviews.length });

    await newReview.populate('student', 'firstName lastName avatar');
    return ApiResponse.created(res, newReview, 'Review submitted');
  } catch (error) { next(error); }
};

// @desc    Get bookmarked courses
// @route   GET /api/courses/bookmarks
exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await require('../models/User').findById(req.user._id).populate('bookmarks');
    return ApiResponse.success(res, user?.bookmarks || []);
  } catch (error) { next(error); }
};

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, optionalAuth, isAdmin, isTrainer } = require('../middleware/auth');
const { imageUpload, documentUpload } = require('../middleware/upload');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/categories', courseController.getPublicCategories);

// Admin/Trainer: get full course by ID for editing (no enrollment required)
// Must be registered BEFORE the wildcard '/:slug' route below, or Express will
// treat "admin" as a slug value and this route will never be reached.
router.get('/admin/:id', authenticate, isTrainer, courseController.getCourseForAdmin);

router.get('/:slug', optionalAuth, courseController.getCourse);

// Student routes
router.get('/:id/content', authenticate, courseController.getCourseContent);
router.post('/:id/progress', authenticate, courseController.updateProgress);
router.post('/:id/reviews', authenticate, courseController.addReview);

// Admin/Trainer routes
router.post('/', authenticate, isTrainer, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), courseController.createCourse);
router.put('/:id', authenticate, isTrainer, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), courseController.updateCourse);
router.delete('/:id', authenticate, isAdmin, courseController.deleteCourse);

// Modules & Lessons
router.post('/:id/modules', authenticate, isTrainer, courseController.addModule);
router.post('/:id/modules/:moduleId/lessons', authenticate, isTrainer, upload.fields([{ name: 'notes', maxCount: 1 }]), courseController.addLesson);

module.exports = router;

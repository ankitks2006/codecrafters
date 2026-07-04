const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const internshipRoutes = require('./internships');
const paymentRoutes = require('./payments');
const certificateRoutes = require('./certificates');
const adminRoutes = require('./admin');
const userRoutes = require('./users');
const notificationRoutes = require('./notifications');
const assignmentRoutes = require('./assignments');
const quizRoutes = require('./quiz');
const blogRoutes = require('./blogs');
const supportRoutes = require('./support');
const mediaRoutes = require('./media');
const enrollmentRoutes = require('./enrollments');

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/internships', internshipRoutes);
router.use('/payments', paymentRoutes);
router.use('/certificates', certificateRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/quiz', quizRoutes);
router.use('/blog', blogRoutes);
router.use('/support', supportRoutes);
router.use('/media', mediaRoutes);
router.use('/enrollments', enrollmentRoutes);

module.exports = router;

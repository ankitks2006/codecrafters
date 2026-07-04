const cron = require('cron');
const { Assignment } = require('../models/Assignment');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Reminder: assignments due in 24 hours
const assignmentReminderJob = new cron.CronJob('0 9 * * *', async () => {
  try {
    logger.info('Running assignment reminder cron job');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const upcomingAssignments = await Assignment.find({
      deadline: { $gte: tomorrow, $lt: dayAfter },
      isPublished: true,
    }).populate('course', 'title').populate('internship', 'title');

    for (const assignment of upcomingAssignments) {
      // Find enrolled students who haven't submitted
      const enrollmentQuery = {};
      if (assignment.course) enrollmentQuery.course = assignment.course._id;
      if (assignment.internship) enrollmentQuery.internship = assignment.internship._id;
      enrollmentQuery.status = 'active';

      const { AssignmentSubmission } = require('../models/Assignment');
      const enrollments = await Enrollment.find(enrollmentQuery).populate('student', 'firstName email notificationPreferences');

      for (const enrollment of enrollments) {
        const submitted = await AssignmentSubmission.exists({ assignment: assignment._id, student: enrollment.student._id });
        if (!submitted && enrollment.student.notificationPreferences?.email) {
          await emailService.sendAssignmentReminder(
            enrollment.student.email,
            enrollment.student.firstName,
            {
              assignmentTitle: assignment.title,
              courseName: assignment.course?.title || assignment.internship?.title,
              deadline: assignment.deadline,
            }
          ).catch(err => logger.error('Reminder email failed:', err));
        }
      }
    }
    logger.info('Assignment reminders sent');
  } catch (error) {
    logger.error('Assignment reminder cron error:', error);
  }
}, null, false, 'Asia/Kolkata');

// Clean expired OTPs
const cleanExpiredOTPJob = new cron.CronJob('0 */6 * * *', async () => {
  try {
    const result = await User.updateMany(
      { otpExpiry: { $lt: new Date() }, isEmailVerified: false },
      { $unset: { otp: 1, otpExpiry: 1 } }
    );
    logger.info(`Cleaned ${result.modifiedCount} expired OTPs`);
  } catch (error) {
    logger.error('Clean OTP cron error:', error);
  }
}, null, false, 'Asia/Kolkata');

// Mark expired enrollments
const checkExpiredEnrollmentsJob = new cron.CronJob('0 0 * * *', async () => {
  try {
    const result = await Enrollment.updateMany(
      { expiresAt: { $lt: new Date() }, status: 'active' },
      { status: 'expired' }
    );
    logger.info(`Marked ${result.modifiedCount} enrollments as expired`);
  } catch (error) {
    logger.error('Enrollment expiry cron error:', error);
  }
}, null, false, 'Asia/Kolkata');

const startCronJobs = () => {
  assignmentReminderJob.start();
  cleanExpiredOTPJob.start();
  checkExpiredEnrollmentsJob.start();
  logger.info('Cron jobs started');
};

module.exports = { startCronJobs };

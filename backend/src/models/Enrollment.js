const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lessonId: mongoose.Schema.Types.ObjectId,
  moduleId: mongoose.Schema.Types.ObjectId,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  watchedSeconds: { type: Number, default: 0 },
});

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['course', 'internship'], required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'suspended', 'expired', 'refunded'],
      default: 'active',
    },
    progress: { type: Number, default: 0 }, // percentage 0-100
    completedAt: Date,
    certificateIssued: { type: Boolean, default: false },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    lessonProgress: [lessonProgressSchema],
    lastAccessedAt: Date,
    // Internship specific
    internshipStatus: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled',
    },
    weeklyReports: [
      {
        week: Number,
        report: String,
        submittedAt: Date,
        mentorFeedback: String,
        rating: Number,
      },
    ],
    mentorFeedback: String,
    performanceScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// enrollmentSchema.index({ student: 1, course: 1 }, { unique: true, sparse: true });
// enrollmentSchema.index({ student: 1, internship: 1 }, { unique: true, sparse: true });
enrollmentSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: {
      course: { $exists: true, $ne: null }
    }
  }
);

enrollmentSchema.index(
  { student: 1, internship: 1 },
  {
    unique: true,
    partialFilterExpression: {
      internship: { $exists: true, $ne: null }
    }
  }
);
enrollmentSchema.index({ student: 1, type: 1});
enrollmentSchema.index({ status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

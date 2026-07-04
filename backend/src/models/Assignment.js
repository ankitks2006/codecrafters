const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructions: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    module: mongoose.Schema.Types.ObjectId,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 },
    allowLateSubmission: { type: Boolean, default: false },
    latePenaltyPercent: { type: Number, default: 0 },
    attachments: [
      {
        title: String,
        url: String,
        publicId: String,
        type: String,
      },
    ],
    submissionType: { type: String, enum: ['file', 'link', 'text', 'mixed'], default: 'file' },
    allowedFileTypes: [String],
    maxFileSizeMB: { type: Number, default: 10 },
    isPublished: { type: Boolean, default: true },
    totalSubmissions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    files: [
      {
        originalName: String,
        url: String,
        publicId: String,
        size: Number,
        mimeType: String,
      },
    ],
    links: [String],
    textAnswer: String,
    status: { type: String, enum: ['submitted', 'under_review', 'graded', 'returned'], default: 'submitted' },
    marks: Number,
    grade: String,
    remarks: String,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date,
    plagiarismScore: Number,
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
const AssignmentSubmission = mongoose.model('AssignmentSubmission', submissionSchema);

module.exports = { Assignment, AssignmentSubmission };

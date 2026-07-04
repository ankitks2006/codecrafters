const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'coding', 'true_false', 'short_answer'], default: 'mcq' },
  question: { type: String, required: true },
  code: String, // for coding questions
  language: String,
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  correctAnswer: String,
  explanation: String,
  marks: { type: Number, default: 1 },
  negativeMark: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String],
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    module: mongoose.Schema.Types.ObjectId,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    duration: { type: Number, default: 30 }, // in minutes
    maxAttempts: { type: Number, default: 3 },
    randomizeQuestions: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
    negativeMarkingEnabled: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    startTime: Date,
    endTime: Date,
  },
  { timestamps: true }
);

quizSchema.pre('save', function (next) {
  this.totalQuestions = this.questions.length;
  this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  next();
});

const quizResultSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNumber: { type: Number, default: 1 },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: Number,
        textAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number,
      },
    ],
    totalMarks: Number,
    obtainedMarks: Number,
    percentage: Number,
    passed: Boolean,
    timeTaken: Number, // in seconds
    startedAt: Date,
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'completed' },
  },
  { timestamps: true }
);

quizResultSchema.index({ quiz: 1, student: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = { Quiz, QuizResult };

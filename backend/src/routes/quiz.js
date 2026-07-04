const express = require('express');
const router = express.Router();
const { Quiz, QuizResult } = require('../models/Quiz');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isTrainer, isAdmin } = require('../middleware/auth');

// Admin: list quizzes created by the current trainer/admin
router.get('/created/mine', authenticate, isTrainer, async (req, res, next) => {
  try {
    const { Quiz } = require('../models/Quiz');
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const query = { createdBy: req.user._id };
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('course', 'title')
        .populate('internship', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Quiz.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, quizzes, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// Get quizzes for enrolled courses/internships
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const Enrollment = require('../models/Enrollment');
    // const enrollments = await Enrollment.find({ student: req.user._id, status: { $in: ['active', 'completed'] } });
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' });
    const courseIds = enrollments.filter(e => e.course).map(e => e.course);
    const internshipIds = enrollments.filter(e => e.internship).map(e => e.internship);
    const quizzes = await Quiz.find({
      $or: [{ course: { $in: courseIds } }, { internship: { $in: internshipIds } }],
      isPublished: true,
    }).populate('course', 'title').populate('internship', 'title').select('-questions.options.isCorrect -questions.correctAnswer -questions.explanation');
    return ApiResponse.success(res, quizzes);
  } catch (e) { next(e); }
});

// Get quiz to attempt (hide answers)
router.get('/:id/attempt', authenticate, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course', 'title').populate('internship', 'title');
    if (!quiz) return ApiResponse.notFound(res, 'Quiz not found');

    // Check attempt count
    const attemptCount = await QuizResult.countDocuments({ quiz: req.params.id, student: req.user._id });
    if (attemptCount >= quiz.maxAttempts) {
      return ApiResponse.error(res, `Maximum ${quiz.maxAttempts} attempts reached`, 400);
    }

    // Randomize and hide correct answers
    let questions = [...quiz.questions];
    if (quiz.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    const safeQuestions = questions.map(q => ({
      _id: q._id,
      type: q.type,
      question: q.question,
      code: q.code,
      options: q.options?.map(o => ({ _id: o._id, text: o.text })),
      marks: q.marks,
      negativeMark: q.negativeMark,
      difficulty: q.difficulty,
    }));

    return ApiResponse.success(res, {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      duration: quiz.duration,
      totalQuestions: quiz.totalQuestions,
      totalMarks: quiz.totalMarks,
      negativeMarkingEnabled: quiz.negativeMarkingEnabled,
      questions: safeQuestions,
      attemptCount,
      maxAttempts: quiz.maxAttempts,
    });
  } catch (e) { next(e); }
});

// Submit quiz
router.post('/:id/submit', authenticate, async (req, res, next) => {
  try {
    const { answers, timeTaken, startedAt } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return ApiResponse.notFound(res, 'Quiz not found');

    const attemptCount = await QuizResult.countDocuments({ quiz: req.params.id, student: req.user._id });
    if (attemptCount >= quiz.maxAttempts) {
      return ApiResponse.error(res, 'Maximum attempts reached', 400);
    }

    // Auto-evaluate MCQ
    let obtainedMarks = 0;
    const evaluatedAnswers = answers.map(ans => {
      const question = quiz.questions.id(ans.questionId);
      if (!question) return { ...ans, isCorrect: false, marksObtained: 0 };

      let isCorrect = false;
      let marksObtained = 0;

      if (question.type === 'mcq' || question.type === 'true_false') {
        const correctOption = question.options.find(o => o.isCorrect);
        const selectedOption = question.options[ans.selectedOption];
        isCorrect = selectedOption?._id?.toString() === correctOption?._id?.toString();
        if (isCorrect) {
          marksObtained = question.marks;
        } else if (quiz.negativeMarkingEnabled && ans.selectedOption !== undefined && ans.selectedOption !== null) {
          marksObtained = -question.negativeMark;
        }
      } else if (question.type === 'short_answer') {
        isCorrect = ans.textAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
        if (isCorrect) marksObtained = question.marks;
      }

      obtainedMarks += marksObtained;
      return { questionId: ans.questionId, selectedOption: ans.selectedOption, textAnswer: ans.textAnswer, isCorrect, marksObtained };
    });

    obtainedMarks = Math.max(0, obtainedMarks);
    const percentage = quiz.totalMarks > 0 ? Math.round((obtainedMarks / quiz.totalMarks) * 100) : 0;
    const passed = obtainedMarks >= quiz.passingMarks;

    const result = await QuizResult.create({
      quiz: req.params.id,
      student: req.user._id,
      attemptNumber: attemptCount + 1,
      answers: evaluatedAnswers,
      totalMarks: quiz.totalMarks,
      obtainedMarks,
      percentage,
      passed,
      timeTaken,
      startedAt,
    });

    return ApiResponse.created(res, {
      resultId: result._id,
      obtainedMarks,
      totalMarks: quiz.totalMarks,
      percentage,
      passed,
      passingMarks: quiz.passingMarks,
      timeTaken,
      ...(quiz.showResultImmediately && {
        answers: evaluatedAnswers,
        questions: quiz.questions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      }),
    }, passed ? 'Congratulations! You passed the quiz.' : 'Quiz submitted. Better luck next time!');
  } catch (e) { next(e); }
});

// Get quiz results history
router.get('/:id/results', authenticate, async (req, res, next) => {
  try {
    const results = await QuizResult.find({ quiz: req.params.id, student: req.user._id }).sort('-createdAt');
    return ApiResponse.success(res, results);
  } catch (e) { next(e); }
});

// Leaderboard
router.get('/:id/leaderboard', authenticate, async (req, res, next) => {
  try {
    const leaderboard = await QuizResult.aggregate([
      { $match: { quiz: require('mongoose').Types.ObjectId(req.params.id) } },
      { $sort: { obtainedMarks: -1, timeTaken: 1 } },
      { $group: { _id: '$student', bestScore: { $first: '$obtainedMarks' }, bestTime: { $first: '$timeTaken' }, attempts: { $sum: 1 } } },
      { $sort: { bestScore: -1, bestTime: 1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { 'student.firstName': 1, 'student.lastName': 1, 'student.avatar': 1, bestScore: 1, bestTime: 1, attempts: 1 } },
    ]);
    return ApiResponse.success(res, leaderboard);
  } catch (e) { next(e); }
});

// Create quiz (trainer/admin)
router.post('/', authenticate, isTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    return ApiResponse.created(res, quiz, 'Quiz created');
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, isTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return ApiResponse.notFound(res, 'Quiz not found');
    return ApiResponse.success(res, quiz, 'Quiz updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    await QuizResult.deleteMany({ quiz: req.params.id });
    return ApiResponse.success(res, null, 'Quiz deleted');
  } catch (e) { next(e); }
});

module.exports = router;

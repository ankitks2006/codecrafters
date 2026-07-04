import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiClock, FiChevronLeft, FiChevronRight, FiSend, FiAward,
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiList,
} from 'react-icons/fi';
import { quizService } from '../../services';
import { Spinner, Modal } from '../../components/ui/index.jsx';

/* ── Timer hook ─────────────────────────────────────────────────────────────── */
const useTimer = (durationMinutes, onExpire) => {
  const [seconds, setSeconds] = useState(durationMinutes * 60);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpire]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds < 120;
  const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return { label, isWarning, secondsLeft: seconds };
};

/* ── Quiz Attempt ────────────────────────────────────────────────────────────── */
const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const viewResultsMode = location.state?.viewResults;

  const [phase, setPhase] = useState(viewResultsMode ? 'results' : 'loading'); // loading | attempt | submitted | results
  const [answers, setAnswers] = useState({});  // { questionId: optionIndex }
  const [currentQ, setCurrentQ] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [result, setResult] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  /* Load the quiz attempt data */
  const { data, isLoading, error } = useQuery(
    ['quiz-attempt', id],
    () => quizService.getAttempt(id),
    {
      enabled: !viewResultsMode,
      retry: 0,
      onSuccess: () => setPhase('attempt'),
      onError: (err) => {
        const msg = err?.response?.data?.message || 'Could not load quiz';
        toast.error(msg);
        setPhase('error');
      },
    }
  );
  const quiz = data?.data?.data;

  /* Load past results if in results mode */
  const { data: resultsData } = useQuery(
    ['quiz-results', id],
    () => quizService.getResults(id),
    { enabled: viewResultsMode || phase === 'results' }
  );
  const pastResults = resultsData?.data?.data || [];

  /* Submit mutation */
  const submitMutation = useMutation(
    (payload) => quizService.submit(id, payload),
    {
      onSuccess: (res) => {
        setResult(res.data.data);
        setPhase('submitted');
      },
      onError: () => setPhase('attempt'),
    }
  );

  const handleAutoSubmit = useCallback(() => {
    if (phase !== 'attempt') return;
    toast('⏰ Time is up! Submitting automatically...', { duration: 3000 });
    doSubmit();
  }, [phase]);

  const { label: timerLabel, isWarning } = useTimer(
    quiz?.duration || 30,
    handleAutoSubmit
  );

  const doSubmit = useCallback(() => {
    if (!quiz) return;
    setConfirmSubmit(false);
    const payload = {
      answers: quiz.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] !== undefined ? answers[q._id] : null,
      })),
      timeTaken: Math.round((new Date() - new Date(startedAt)) / 1000),
      startedAt,
    };
    submitMutation.mutate(payload);
  }, [quiz, answers, startedAt]);

  const selectAnswer = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const answeredCount = quiz ? quiz.questions.filter(q => answers[q._id] !== undefined).length : 0;

  /* ── RENDER: Loading ── */
  if (isLoading || phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading quiz…</p>
        </div>
      </div>
    );
  }

  /* ── RENDER: Error / max attempts ── */
  if (phase === 'error' || (!quiz && !viewResultsMode)) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <FiAlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cannot Start Quiz</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">You may have reached the maximum number of attempts, or the quiz is not available right now.</p>
        <Link to="/dashboard/quiz" className="btn-primary inline-block">Back to Quizzes</Link>
      </div>
    );
  }

  /* ── RENDER: Results view ── */
  if (phase === 'results' || viewResultsMode) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/quiz" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500">
            <FiChevronLeft size={18} />
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quiz Results</h1>
        </div>
        {pastResults.length > 0 ? (
          <div className="space-y-4">
            {pastResults.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Attempt #{r.attemptNumber}</span>
                  <span className={`badge text-xs ${r.passed ? 'badge-success' : 'badge-danger'}`}>
                    {r.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{r.obtainedMarks}</p>
                    <p className="text-xs text-gray-500">/ {r.totalMarks} marks</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-black ${r.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {Math.floor((r.timeTaken || 0) / 60)}m
                    </p>
                    <p className="text-xs text-gray-500">Time taken</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(r.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-gray-400">No attempts recorded yet.</p>
            <Link to={`/dashboard/quiz/${id}/attempt`} className="btn-primary mt-4 inline-block">Take Quiz</Link>
          </div>
        )}
      </div>
    );
  }

  /* ── RENDER: Post-submit result card ── */
  if (phase === 'submitted' && result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto pt-10 space-y-6">
        <div className="card p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result.passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {result.passed
              ? <FiAward size={36} className="text-green-600" />
              : <FiXCircle size={36} className="text-red-500" />}
          </div>
          <h2 className={`text-2xl font-black mb-1 ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
            {result.passed ? 'Congratulations! 🎉' : 'Better Luck Next Time'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{result.passed ? 'You passed the quiz!' : 'Keep practising and try again.'}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-3">
              <p className="text-2xl font-black text-gray-900 dark:text-white">{result.obtainedMarks}</p>
              <p className="text-xs text-gray-500">/ {result.totalMarks}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-3">
              <p className={`text-2xl font-black ${result.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>{result.percentage}%</p>
              <p className="text-xs text-gray-500">Score</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-3">
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {Math.floor((result.timeTaken || 0) / 60)}m{(result.timeTaken || 0) % 60}s
              </p>
              <p className="text-xs text-gray-500">Time</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/dashboard/quiz" className="flex-1 btn-secondary text-sm py-2.5">All Quizzes</Link>
            <button onClick={() => setPhase('results')} className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-1.5">
              <FiList size={14} /> All Results
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── RENDER: Active attempt ── */
  const currentQuestion = quiz?.questions?.[currentQ];
  const isLast = currentQ === (quiz?.questions?.length || 1) - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">{quiz?.title}</h2>
          <p className="text-xs text-gray-500">{answeredCount} of {quiz?.questions?.length} answered</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${
          isWarning ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300'
        }`}>
          <FiClock size={14} /> {timerLabel}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-dark-300 rounded-full h-1.5">
        <div className="bg-primary-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentQ + 1) / (quiz?.questions?.length || 1)) * 100}%` }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {currentQ + 1}
              </span>
              <p className="font-semibold text-gray-900 dark:text-white leading-relaxed">{currentQuestion.question}</p>
            </div>

            {currentQuestion.code && (
              <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-sm overflow-x-auto font-mono">
                {currentQuestion.code}
              </pre>
            )}

            {currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false' ? (
              <div className="space-y-2">
                {currentQuestion.options?.map((opt, idx) => (
                  <button key={opt._id || idx} onClick={() => selectAnswer(currentQuestion._id, idx)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      answers[currentQuestion._id] === idx
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-dark-300 hover:border-primary-300 text-gray-700 dark:text-gray-300'
                    }`}>
                    <span className="font-bold mr-3 text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[currentQuestion._id] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion._id]: e.target.value }))}
                rows={4}
                placeholder="Type your answer here..."
                className="input resize-none"
              />
            )}

            {quiz?.negativeMarkingEnabled && (
              <p className="text-xs text-orange-500">⚠ Negative marking: -{currentQuestion.negativeMark} for wrong answer</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-40">
                <FiChevronLeft size={15} /> Previous
              </button>

              <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                {quiz?.questions?.map((_, i) => (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      i === currentQ
                        ? 'bg-primary-500 text-white'
                        : answers[quiz.questions[i]._id] !== undefined
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {isLast ? (
                <button onClick={() => setConfirmSubmit(true)} className="btn-primary text-sm flex items-center gap-1.5">
                  Submit <FiSend size={14} />
                </button>
              ) : (
                <button onClick={() => setCurrentQ(q => q + 1)}
                  className="btn-primary text-sm flex items-center gap-1.5">
                  Next <FiChevronRight size={15} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm submit modal */}
      <Modal isOpen={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit Quiz?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have answered <strong>{answeredCount}</strong> of <strong>{quiz?.questions?.length}</strong> questions.
            {answeredCount < quiz?.questions?.length && ` ${quiz.questions.length - answeredCount} unanswered questions will score zero.`}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmSubmit(false)} className="flex-1 btn-secondary" disabled={submitMutation.isLoading}>
              Review
            </button>
            <button onClick={doSubmit} disabled={submitMutation.isLoading}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {submitMutation.isLoading ? <><Spinner size="sm" /> Submitting…</> : <><FiSend size={14} /> Submit</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizAttempt;

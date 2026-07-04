import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHelpCircle, FiClock, FiTarget, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { quizService } from '../../services';
import { EmptyState, Spinner } from '../../components/ui/index.jsx';

const Quiz = () => {
  const { data, isLoading } = useQuery('my-quizzes', quizService.getMyQuizzes);
  const quizzes = data?.data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quizzes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : quizzes.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card p-5 hover:shadow-glow transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                  <FiHelpCircle size={18} />
                </div>
                <span className="badge-primary text-xs">{quiz.maxAttempts} attempts max</span>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{quiz.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1"><FiClock size={12} /> {quiz.duration} min</span>
                <span className="flex items-center gap-1"><FiHelpCircle size={12} /> {quiz.totalQuestions} questions</span>
                <span className="flex items-center gap-1"><FiTarget size={12} /> {quiz.totalMarks} marks</span>
              </div>

              <div className="flex gap-2">
                <Link to={`/dashboard/quiz/${quiz._id}/attempt`}
                  className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                  Start Quiz <FiArrowRight size={14} />
                </Link>
                <Link to={`/dashboard/quiz/${quiz._id}/attempt`}
                  state={{ viewResults: true }}
                  className="btn-secondary text-sm px-3 py-2.5 flex items-center gap-1.5">
                  <FiCheckCircle size={14} /> Results
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiHelpCircle} title="No quizzes yet"
          description="Quizzes for your enrolled courses will appear here" />
      )}
    </div>
  );
};

export default Quiz;

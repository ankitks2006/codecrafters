import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBook, FiClock, FiAward, FiPlay, FiTrendingUp } from 'react-icons/fi';
import { enrollmentService } from '../../services';
import { ProgressBar, EmptyState, SkeletonCard } from '../../components/ui/index.jsx';

const MyCourses = () => {
  const { data, isLoading } = useQuery('my-enrollments-course', () => enrollmentService.getMyEnrollments({ type: 'course' }));
  const enrollments = data?.data?.data || [];

  const completed = enrollments.filter(e => e.status === 'completed');
  const active = enrollments.filter(e => e.status === 'active');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{enrollments.length} enrolled • {completed.length} completed</p>
        </div>
        <Link to="/courses" className="btn-primary text-sm">Browse More</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrolled', value: enrollments.length, icon: FiBook, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
          { label: 'In Progress', value: active.length, icon: FiTrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Completed', value: completed.length, icon: FiAward, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4"><SkeletonCard count={4} /></div>
      ) : enrollments.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {enrollments.map((enrollment, i) => {
            const course = enrollment.course;
            if (!course) return null;
            return (
              <motion.div key={enrollment._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card overflow-hidden hover:shadow-glow transition-all group">
                <div className="flex gap-4 p-4">
                  <img src={course.thumbnail || 'https://placehold.co/120x80/6C63FF/white?text=Course'}
                    alt={course.title} className="w-24 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {course.title}
                      </h3>
                      {enrollment.status === 'completed' && (
                        <span className="badge-success text-xs flex-shrink-0">✓ Done</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Instructor'}
                    </p>
                    <ProgressBar value={enrollment.progress} showLabel={false} size="sm" />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-500">{enrollment.progress}% complete</span>
                      {enrollment.lastAccessedAt && (
                        <span className="text-xs text-gray-400">
                          Last: {new Date(enrollment.lastAccessedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link to={`/dashboard/courses/${course._id}/learn`}
                    className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                    <FiPlay size={14} />
                    {enrollment.progress === 0 ? 'Start Learning' : enrollment.progress === 100 ? 'Review Course' : 'Continue'}
                  </Link>
                </div>
                {enrollment.certificateIssued && (
                  <Link to="/dashboard/certificates"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-semibold hover:bg-green-100 transition-all">
                    <FiAward size={13} /> Download Certificate
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FiBook}
          title="No courses yet"
          description="Enroll in a course to start your learning journey"
          action={<Link to="/courses" className="btn-primary">Browse Courses</Link>}
        />
      )}
    </div>
  );
};

export default MyCourses;

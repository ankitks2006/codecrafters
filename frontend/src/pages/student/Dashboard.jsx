import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiBook, FiBriefcase, FiAward, FiTrendingUp, FiClock,
  FiCheckSquare, FiArrowRight, FiZap, FiCalendar,
} from 'react-icons/fi';
import { userService } from '../../services';
import { StatCard, ProgressBar, SkeletonCard } from '../../components/ui/index.jsx';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const StudentDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const { data, isLoading } = useQuery('dashboard-stats', userService.getDashboardStats, {
    staleTime: 2 * 60 * 1000,
  });

  const stats = data?.data?.data || {};

  const quickLinks = [
    { label: 'Continue Learning', icon: FiBook, to: '/dashboard/courses', color: 'primary', desc: 'Pick up where you left off' },
    { label: 'My Internships', icon: FiBriefcase, to: '/dashboard/internships', color: 'blue', desc: 'Track your progress' },
    { label: 'My Certificates', icon: FiAward, to: '/dashboard/certificates', color: 'green', desc: 'Download & share' },
    { label: 'Assignments', icon: FiCheckSquare, to: '/dashboard/assignments', color: 'orange', desc: 'Submit pending work' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <motion.div variants={fadeUp} className="card p-6 gradient-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.firstName}! 👋
            </h1>
            <p className="text-primary-100 text-sm">
              {stats.totalCourses > 0
                ? `You're making great progress! Keep it up. 🚀`
                : `Welcome! Start your learning journey today.`}
            </p>
          </div>
          <Link to="/courses" className="bg-white text-primary-600 hover:bg-gray-50 font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm">
            Explore Courses <FiArrowRight size={16} />
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={fadeUp}>
          <StatCard title="Enrolled Courses" value={isLoading ? '—' : stats.totalCourses || 0} icon={FiBook} color="primary" loading={isLoading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard title="Internships" value={isLoading ? '—' : stats.totalInternships || 0} icon={FiBriefcase} color="blue" loading={isLoading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard title="Certificates" value={isLoading ? '—' : stats.totalCertificates || 0} icon={FiAward} color="green" loading={isLoading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard title="Avg. Progress" value={isLoading ? '—' : `${stats.avgProgress || 0}%`} icon={FiTrendingUp} color="orange" loading={isLoading} />
        </motion.div>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={fadeUp}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to}>
              <motion.div whileHover={{ y: -3 }}
                className="card p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  link.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' :
                  link.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  link.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                }`}>
                  <link.icon size={18} />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{link.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Courses & Profile Completion */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Continue Learning</h2>
            <Link to="/dashboard/courses" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)
            ) : stats.recentCourses?.length > 0 ? (
              stats.recentCourses.map(enrollment => (
                <Link key={enrollment._id} to={`/dashboard/courses/${enrollment.course?._id}/learn`}>
                  <motion.div whileHover={{ x: 4 }}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                    <img
                      src={enrollment.course?.thumbnail || 'https://placehold.co/80x60/6C63FF/white?text=Course'}
                      alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {enrollment.course?.title}
                      </p>
                      <ProgressBar value={enrollment.progress} showLabel={false} size="sm" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.progress}% complete</p>
                    </div>
                    <FiArrowRight className="text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="card p-8 text-center">
                <FiBook size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No courses enrolled yet</p>
                <Link to="/courses" className="btn-primary text-sm">Browse Courses</Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile Completion + Alerts */}
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Profile completion */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="text-primary-500" size={18} />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Profile Completion</h3>
            </div>
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-100 dark:text-dark-300" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeDasharray={`${user?.profileCompletion || 0} 100`} strokeLinecap="round"
                  className="text-primary-500 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-gray-900 dark:text-white">{user?.profileCompletion || 0}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">Complete your profile to unlock all features</p>
            <Link to="/dashboard/profile" className="btn-primary w-full text-center text-sm py-2 block">Complete Profile</Link>
          </div>

          {/* Status summary */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Status</h3>
            {[
              { label: 'Open Tickets', value: stats.openTickets || 0, color: 'text-orange-500', to: '/dashboard/tickets' },
              { label: 'Pending Assignments', value: stats.pendingAssignments || 0, color: 'text-red-500', to: '/dashboard/assignments' },
            ].map(item => (
              <Link key={item.label} to={item.to}
                className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-300 p-2 rounded-lg transition-all">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className={`font-bold text-sm ${item.value > 0 ? item.color : 'text-green-500'}`}>
                  {item.value > 0 ? item.value : '✓ None'}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;

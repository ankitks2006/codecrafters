import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FiUsers, FiBook, FiBriefcase, FiDollarSign, FiAward,
  FiLifeBuoy, FiTrendingUp, FiActivity, FiArrowRight,
} from 'react-icons/fi';
import { adminService } from '../../services';
import { StatCard } from '../../components/ui/index.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const chartDefaults = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } } } };

const AdminDashboard = () => {
  const { data: overviewData, isLoading: overviewLoading } = useQuery('admin-overview', adminService.getOverview, { staleTime: 60000 });
  const { data: revenueData } = useQuery('admin-revenue', () => adminService.getRevenue({ period: 12 }), { staleTime: 60000 });
  const { data: userAnalytics } = useQuery('admin-users', adminService.getUserAnalytics, { staleTime: 60000 });

  const overview = overviewData?.data?.data || {};
  const monthly = revenueData?.data?.data?.monthly || [];
  const topCourses = revenueData?.data?.data?.topCourses || [];
  const userGrowth = userAnalytics?.data?.data?.growth || [];
  const recentUsers = userAnalytics?.data?.data?.recent || [];

  const revenueChartData = {
    labels: monthly.map(m => `${MONTHS[m._id.month - 1]} ${m._id.year}`),
    datasets: [{
      label: 'Revenue (₹)',
      data: monthly.map(m => m.revenue),
      backgroundColor: 'rgba(108, 99, 255, 0.2)',
      borderColor: '#6C63FF',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }],
  };

  const userGrowthData = {
    labels: userGrowth.map(u => `${MONTHS[u._id.month - 1]} '${String(u._id.year).slice(-2)}`),
    datasets: [{
      label: 'New Students',
      data: userGrowth.map(u => u.count),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 6,
    }],
  };

  const enrollmentData = {
    labels: ['Courses', 'Internships', 'Completed'],
    datasets: [{
      data: [overview.enrollments?.total || 0, overview.internships?.total || 0, overview.certificates?.total || 0],
      backgroundColor: ['#6C63FF', '#10b981', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Platform overview and analytics</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/analytics" className="btn-secondary text-sm flex items-center gap-2">
            <FiTrendingUp size={15} /> Full Analytics
          </Link>
          <Link to="/admin/users" className="btn-primary text-sm flex items-center gap-2">
            <FiUsers size={15} /> Manage Users
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Students', value: overview.users?.total?.toLocaleString() || '—', icon: FiUsers, color: 'primary', trend: overview.users?.growth, trendLabel: 'this month' },
          { title: 'Total Revenue', value: overview.revenue?.total ? `₹${(overview.revenue.total/100000).toFixed(1)}L` : '—', icon: FiDollarSign, color: 'green', trend: overview.revenue?.growth, trendLabel: 'vs last month' },
          { title: 'Active Courses', value: overview.courses?.published || '—', icon: FiBook, color: 'blue' },
          { title: 'Certificates Issued', value: overview.certificates?.total?.toLocaleString() || '—', icon: FiAward, color: 'orange' },
        ].map(stat => (
          <motion.div key={stat.title} variants={fadeUp}>
            <StatCard {...stat} loading={overviewLoading} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
            <span className="badge-success text-xs">Last 12 Months</span>
          </div>
          {monthly.length > 0 ? (
            <Line data={revenueChartData} options={{ ...chartDefaults, scales: { y: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}K` }, grid: { color: 'rgba(0,0,0,0.04)' } } } }} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
          )}
        </motion.div>

        {/* Enrollment Distribution */}
        <motion.div variants={fadeUp} className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
          <Doughnut data={enrollmentData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }, cutout: '65%' }} />
          <div className="mt-4 space-y-2">
            {[
              { label: 'This Month Revenue', value: `₹${(overview.revenue?.thisMonth || 0).toLocaleString('en-IN')}` },
              { label: 'Monthly Enrollments', value: overview.enrollments?.thisMonth || 0 },
              { label: 'Open Tickets', value: overview.openTickets || 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* User Growth + Recent Users */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Student Growth</h2>
          {userGrowth.length > 0 ? (
            <Bar data={userGrowthData} options={{ ...chartDefaults, scales: { y: { grid: { color: 'rgba(0,0,0,0.04)' } } } }} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Students</h2>
            <Link to="/admin/users" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length > 0 ? recentUsers.slice(0, 7).map(u => (
              <div key={u._id} className="flex items-center gap-3">
                <img
                  src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6C63FF&color=fff&size=32`}
                  alt="" className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  <span className={`text-xs font-medium ${u.isEmailVerified ? 'text-green-500' : 'text-orange-500'}`}>
                    {u.isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-sm text-center py-6">No recent users</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Revenue Courses */}
      {topCourses.length > 0 && (
        <motion.div variants={fadeUp} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Top Revenue Courses</h2>
            <Link to="/admin/courses" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">Manage →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-300">
                  {['Course', 'Enrollments', 'Revenue'].map(h => (
                    <th key={h} className="text-left pb-3 text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                {topCourses.map((course, i) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{course.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{course.count} students</td>
                    <td className="py-3 font-semibold text-green-600">₹{course.revenue?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Quick Admin Actions */}
      <motion.div variants={fadeUp}>
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Add Course', to: '/admin/courses/new', icon: FiBook, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' },
            { label: 'Manage Users', to: '/admin/users', icon: FiUsers, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
            { label: 'Payments', to: '/admin/payments', icon: FiDollarSign, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
            { label: 'Open Tickets', to: '/admin/support', icon: FiLifeBuoy, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
          ].map(action => (
            <Link key={action.to} to={action.to}>
              <motion.div whileHover={{ y: -3 }} className="card p-4 hover:shadow-glow transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon size={18} />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{action.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;

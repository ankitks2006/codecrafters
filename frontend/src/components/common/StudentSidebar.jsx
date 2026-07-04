import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiHome, FiBook, FiBriefcase, FiAward, FiUser, FiFileText,
  FiCheckSquare, FiHelpCircle, FiCreditCard, FiLifeBuoy,
  FiBell, FiSettings, FiLogOut, FiChevronLeft, FiTrendingUp,
} from 'react-icons/fi';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services';

const navItems = [
  { label: 'Dashboard', icon: FiHome, to: '/dashboard' },
  { label: 'My Courses', icon: FiBook, to: '/dashboard/courses' },
  { label: 'Internships', icon: FiBriefcase, to: '/dashboard/internships' },
  { label: 'Certificates', icon: FiAward, to: '/dashboard/certificates' },
  { label: 'Assignments', icon: FiCheckSquare, to: '/dashboard/assignments' },
  { label: 'Quiz', icon: FiHelpCircle, to: '/dashboard/quiz' },
  { label: 'Leaderboard', icon: FiTrendingUp, to: '/dashboard/leaderboard' },
  { label: 'Resume', icon: FiFileText, to: '/dashboard/resume' },
  { label: 'Payments', icon: FiCreditCard, to: '/dashboard/payments' },
  { label: 'Support', icon: FiLifeBuoy, to: '/dashboard/tickets' },
  { label: 'Notifications', icon: FiBell, to: '/dashboard/notifications' },
  { label: 'Profile', icon: FiUser, to: '/dashboard/profile' },
  { label: 'Settings', icon: FiSettings, to: '/dashboard/settings' },
];

const StudentSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen, mobileSidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);

  const handleLogout = async () => {
    await authService.logout().catch(() => {});
    dispatch(logout());
    navigate('/');
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-50 flex flex-col
      bg-white dark:bg-dark-100 border-r border-gray-100 dark:border-dark-300
      transition-all duration-300 shadow-lg lg:shadow-none
      ${sidebarOpen ? 'w-64' : 'w-20'}
      ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-300 h-16">
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">CCT</span>
          </motion.div>
        )}
        <button onClick={() => dispatch(toggleSidebar())}
          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 transition-all text-gray-500 ${!sidebarOpen && 'mx-auto'}`}>
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
            <FiChevronLeft size={16} />
          </motion.div>
        </button>
      </div>

      {/* User info */}
      {sidebarOpen && (
        <div className="p-4 border-b border-gray-100 dark:border-dark-300">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C63FF&color=fff&size=40`}
              alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
              <span className="badge-primary text-xs">{user?.role}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Profile completion</span>
              <span>{user?.profileCompletion || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-300 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${user?.profileCompletion || 0}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2 no-scrollbar">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group relative ${
                isActive
                  ? 'bg-primary-500 text-white shadow-glow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
                {item.label}
              </motion.span>
            )}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-all">
                {item.label}
              </div>
            )}
            {item.label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-100 dark:border-dark-300">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group relative">
          <FiLogOut size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;

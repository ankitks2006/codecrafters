import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiHome, FiBook, FiBriefcase, FiAward, FiUsers, FiCreditCard,
  FiBell, FiSettings, FiLogOut, FiChevronLeft, FiBarChart2,
  FiFileText, FiCheckSquare, FiHelpCircle, FiLifeBuoy, FiTag,
  FiLayers, FiMessageSquare, FiGrid,
} from 'react-icons/fi';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: FiHome, to: '/admin' },
      { label: 'Analytics', icon: FiBarChart2, to: '/admin/analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Courses', icon: FiBook, to: '/admin/courses' },
      { label: 'Internships', icon: FiBriefcase, to: '/admin/internships' },
      { label: 'Blogs', icon: FiFileText, to: '/admin/blogs' },
      { label: 'Categories', icon: FiGrid, to: '/admin/categories' },
    ],
  },
  {
    label: 'Students',
    items: [
      { label: 'Users', icon: FiUsers, to: '/admin/users' },
      { label: 'Enrollments', icon: FiLayers, to: '/admin/enrollments' },
      { label: 'Certificates', icon: FiAward, to: '/admin/certificates' },
      { label: 'Assignments', icon: FiCheckSquare, to: '/admin/assignments' },
      { label: 'Quizzes', icon: FiHelpCircle, to: '/admin/quizzes' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', icon: FiCreditCard, to: '/admin/payments' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Support Tickets', icon: FiLifeBuoy, to: '/admin/support' },
      { label: 'Notifications', icon: FiBell, to: '/admin/notifications' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', icon: FiSettings, to: '/admin/settings' },
    ],
  },
];

const AdminSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen, mobileSidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);

  const handleLogout = async () => {
    await authService.logout().catch(() => {});
    dispatch(logout());
    navigate('/');
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-50 flex flex-col
      bg-dark-100 border-r border-dark-300
      transition-all duration-300 shadow-xl
      ${sidebarOpen ? 'w-64' : 'w-20'}
      ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-dark-300 h-16">
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <div>
              <p className="font-bold text-xs text-white">Code Crafters</p>
              <p className="text-xs text-primary-400">Admin Panel</p>
            </div>
          </motion.div>
        )}
        <button onClick={() => dispatch(toggleSidebar())}
          className={`p-1.5 rounded-lg hover:bg-dark-300 transition-all text-gray-400 ${!sidebarOpen && 'mx-auto'}`}>
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
            <FiChevronLeft size={16} />
          </motion.div>
        </button>
      </div>

      {/* User */}
      {sidebarOpen && (
        <div className="p-4 border-b border-dark-300">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C63FF&color=fff`}
              alt="" className="w-9 h-9 rounded-full ring-2 ring-primary-500"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <span className="text-xs text-primary-400 font-medium">{user?.role?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 no-scrollbar space-y-1">
        {navGroups.map(group => (
          <div key={group.label}>
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">{group.label}</p>
            )}
            {!sidebarOpen && <div className="border-t border-dark-300 my-2" />}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all group relative ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-glow'
                      : 'text-gray-400 hover:bg-dark-300 hover:text-white'
                  }`
                }
              >
                <item.icon size={17} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-dark-300">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/20 transition-all group relative">
          <FiLogOut size={17} />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

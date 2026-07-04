// DashboardHeader.jsx
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiMenu, FiSun, FiMoon, FiBell } from 'react-icons/fi';
import { toggleMobileSidebar } from '../../redux/slices/uiSlice';
import { toggleTheme } from '../../redux/slices/uiSlice';

const DashboardHeader = ({ isAdmin = false }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);

  return (
    <header className="h-16 bg-white dark:bg-dark-100 border-b border-gray-100 dark:border-dark-300 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={() => dispatch(toggleMobileSidebar())}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400">
          <FiMenu size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}! 👋
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400 transition-all">
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <Link to={isAdmin ? '/admin/notifications' : '/dashboard/notifications'}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400 transition-all">
          <FiBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to={isAdmin ? '/admin' : '/dashboard/profile'}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C63FF&color=fff`}
            alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500 cursor-pointer"
          />
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;

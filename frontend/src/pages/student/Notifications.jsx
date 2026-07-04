import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiInfo, FiAlertTriangle, FiAward, FiCreditCard, FiBook, FiCheck } from 'react-icons/fi';
import { notificationService } from '../../services';
import { markAllRead } from '../../redux/slices/notificationSlice';
import { EmptyState, Spinner, Pagination } from '../../components/ui/index.jsx';

const ICONS = {
  success: FiCheckCircle, warning: FiAlertTriangle, error: FiAlertTriangle,
  announcement: FiBell, course: FiBook, internship: FiBook,
  payment: FiCreditCard, certificate: FiAward, assignment: FiBook, info: FiInfo,
};

const COLORS = {
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  warning: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  announcement: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  course: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  internship: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  payment: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  certificate: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  assignment: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  info: 'text-gray-500 bg-gray-100 dark:bg-dark-300',
};

const Notifications = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery(
    ['my-notifications', page, filter],
    () => notificationService.getAll({ page, limit: 15, unreadOnly: filter === 'unread' || undefined }),
    { keepPreviousData: true }
  );
  const notifications = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      queryClient.invalidateQueries(['my-notifications']);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch(markAllRead());
      queryClient.invalidateQueries(['my-notifications']);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {pagination.unreadCount > 0 ? `${pagination.unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {pagination.unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <FiCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : notifications.length > 0 ? (
        <>
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = ICONS[n.type] || FiInfo;
              const colorClass = COLORS[n.type] || COLORS.info;
              const content = (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`card p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-md ${
                    !n.isRead ? 'border-l-4 border-l-primary-500' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
              return n.link ? <Link key={n._id} to={n.link}>{content}</Link> : content;
            })}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiBell} title="No notifications" description="You're all caught up! New updates will appear here." />
      )}
    </div>
  );
};

export default Notifications;

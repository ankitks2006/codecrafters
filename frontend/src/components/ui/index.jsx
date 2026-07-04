import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

// ─── Loading Screen ───────────────────────────────────────────────────────────
export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-white dark:bg-dark-900 flex items-center justify-center z-50">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
        <span className="text-white font-black text-2xl">CC</span>
      </div>
      <div className="flex gap-1.5 justify-center mt-4">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 bg-primary-500 rounded-full"
            animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </motion.div>
  </div>
);

export default LoadingScreen;

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin ${className}`} />
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizes[size]} card shadow-2xl max-h-[90vh] flex flex-col`}>
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-400 hover:text-gray-600 transition-all">
                  <FiX size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && <div className="p-6 border-t border-gray-100 dark:border-dark-300">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const SkeletonCard = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-5 space-y-3">
        <div className="skeleton h-40 w-full rounded-xl" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-9 w-28 rounded-lg" />
        </div>
      </div>
    ))}
  </>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, trend, trendLabel, color = 'primary', loading = false }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
  };

  if (loading) return (
    <div className="card p-6 space-y-3">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="skeleton h-8 w-24 rounded" />
      <div className="skeleton h-4 w-32 rounded" />
    </div>
  );

  return (
    <motion.div whileHover={{ y: -2 }} className="card p-6">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={22} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </motion.div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'primary' }) => {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };
  return <span className={variants[variant]}>{children}</span>;
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-dark-300 flex items-center justify-center mb-4">
      {Icon && <Icon size={36} className="text-gray-400" />}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
    footer={
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'btn-primary'}`}>
          {loading ? <Spinner size="sm" /> : confirmText}
        </button>
      </div>
    }>
    <p className="text-gray-600 dark:text-gray-400">{message}</p>
  </Modal>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'primary', showLabel = true, size = 'md' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span><span>{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-dark-300 rounded-full ${heights[size]}`}>
        <motion.div className={`${colors[color]} ${heights[size]} rounded-full`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  const range = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    if (pages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pages - 2) return pages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400 transition-all">
        ← Prev
      </button>
      {range.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400'}`}>
          {p}
        </button>
      ))}
      <button disabled={page === pages} onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-600 dark:text-gray-400 transition-all">
        Next →
      </button>
    </div>
  );
};

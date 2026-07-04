import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSend, FiUsers, FiGlobe, FiBell } from 'react-icons/fi';
import { notificationService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const TYPES = ['info', 'success', 'warning', 'announcement', 'course', 'internship', 'payment', 'certificate', 'assignment'];
const ROLES = ['student', 'trainer', 'hr', 'admin'];

const AdminNotifications = () => {
  const [target, setTarget] = useState('role'); // 'role' | 'global'
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { type: 'announcement', roles: 'student' },
  });

  const onSubmit = async (data) => {
    setSending(true);
    try {
      const payload = {
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || undefined,
      };
      if (target === 'global') {
        payload.isGlobal = true;
      } else {
        payload.roles = [data.roles];
      }
      await notificationService.send(payload);
      toast.success(target === 'global' ? 'Sent to all users!' : `Sent to all ${data.roles}s!`);
      reset({ type: 'announcement', roles: 'student', title: '', message: '', link: '' });
    } catch {
      // error toast handled by interceptor
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Send Notification</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Broadcast announcements to students, trainers, or all platform users
        </p>
      </div>

      <div className="card p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTarget('role')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              target === 'role' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
            }`}>
            <FiUsers size={16} /> By Role
          </button>
          <button onClick={() => setTarget('global')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              target === 'global' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
            }`}>
            <FiGlobe size={16} /> Everyone
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {target === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Send to role</label>
              <select {...register('roles')} className="input">
                {ROLES.map(r => <option key={r} value={r}>{r}s</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <select {...register('type')} className="input">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input {...register('title', { required: 'Required', maxLength: { value: 100, message: 'Max 100 characters' } })}
              className="input" placeholder="e.g. New Course Launched!" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
            <textarea {...register('message', { required: 'Required', maxLength: { value: 500, message: 'Max 500 characters' } })}
              rows={4} className="input resize-none" placeholder="Write your announcement..." />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link (optional)</label>
            <input {...register('link')} className="input" placeholder="/courses/new-course-slug" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <FiBell size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This will deliver in real-time via Socket.io to any connected users, and appear in their notification
              center on next load. {target === 'global' ? 'This goes out to every user on the platform.' : ''}
            </p>
          </div>

          <button type="submit" disabled={sending} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            {sending ? <><Spinner size="sm" /> Sending...</> : <><FiSend size={15} /> Send Notification</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;

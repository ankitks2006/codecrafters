import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSun, FiMoon, FiBell, FiLock, FiShield, FiTrash2 } from 'react-icons/fi';
import { toggleTheme } from '../../redux/slices/uiSlice';
import { authService, userService } from '../../services';
import { updateUser } from '../../redux/slices/authSlice';
import { Spinner } from '../../components/ui/index.jsx';

const Settings = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector(s => s.ui);
  const { user } = useSelector(s => s.auth);
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    inApp: user?.notificationPreferences?.inApp ?? true,
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (pwData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwData.newPassword)) {
      toast.error('Password must include uppercase, lowercase and a number'); return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      toast.success('Password changed successfully');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {} finally { setPwLoading(false); }
  };

  const saveNotifPrefs = async () => {
    setNotifLoading(true);
    try {
      const res = await userService.updateProfile({ notificationPreferences: notifPrefs });
      dispatch(updateUser(res.data.data));
      toast.success('Notification preferences saved');
    } catch {} finally { setNotifLoading(false); }
  };

  const Section = ({ title, icon: Icon, children }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-300 pb-3">
        <Icon size={18} className="text-primary-500" />
        <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>

      {/* Appearance */}
      <Section title="Appearance" icon={theme === 'dark' ? FiMoon : FiSun}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">Theme</p>
            <p className="text-xs text-gray-500 mt-0.5">Switch between light and dark mode</p>
          </div>
          <button onClick={() => dispatch(toggleTheme())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-200 transition-all text-sm font-medium">
            {theme === 'dark' ? <><FiSun size={15} /> Light Mode</> : <><FiMoon size={15} /> Dark Mode</>}
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={FiBell}>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive updates, reminders and news by email' },
            { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications inside the platform' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifPrefs[item.key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={saveNotifPrefs} disabled={notifLoading} className="btn-primary text-sm py-2 flex items-center gap-2">
          {notifLoading ? <Spinner size="sm" /> : null} Save Preferences
        </button>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={FiLock}>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 chars, uppercase, number' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              <input
                type="password"
                value={pwData[field.key]}
                onChange={e => setPwData(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="input"
                required
              />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary text-sm py-2 flex items-center gap-2">
            {pwLoading ? <Spinner size="sm" /> : <FiShield size={14} />} Update Password
          </button>
        </form>
      </Section>

      {/* Account */}
      <Section title="Account" icon={FiShield}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-300">
            <span className="text-gray-600 dark:text-gray-400">Account Email</span>
            <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-300">
            <span className="text-gray-600 dark:text-gray-400">Email Verified</span>
            <span className={user?.isEmailVerified ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
              {user?.isEmailVerified ? '✓ Verified' : '⚠ Not verified'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-300">
            <span className="text-gray-600 dark:text-gray-400">Member Since</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600 dark:text-gray-400">Referral Code</span>
            <span className="font-mono font-medium text-primary-600">{user?.referralCode || '—'}</span>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Settings;

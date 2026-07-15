import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch as useReduxDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { authService } from '../../services';
import { setCredentials } from '../../redux/slices/authSlice';
import { Spinner } from '../../components/ui/index.jsx';

// ── Shared Layout ─────────────────────────────────────────────────────────────
const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-100 to-dark-200 flex items-center justify-center p-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
    </div>
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <span className="text-white font-black">TSC</span>
          </div>
        </Link>
        <h1 className="text-2xl font-black text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-glass">
        {children}

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <div className="text-xs text-gray-400">or continue with</div>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="mt-3">
            <button type="button" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`} 
              className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl border border-white/10 transition-colors">
              <FcGoogle size={20} />
              <span className="text-sm font-semibold">Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

const inputClass = "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";

// ── Register Page ─────────────────────────────────────────────────────────────
export const RegisterPage = () => {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.register(data);
      toast.success('Account created! Check your email for the OTP.');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch {} finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join 15,000+ learners today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[['firstName', 'First Name', FiUser], ['lastName', 'Last Name', FiUser]].map(([name, label, Icon]) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input {...register(name, { required: `${label} required` })} placeholder={label}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all" />
              </div>
              {errors[name] && <p className="text-red-400 text-xs mt-0.5">{errors[name].message}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
              type="email" placeholder="you@example.com" className={inputClass} />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">Phone (optional)</label>
          <div className="relative">
            <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input {...register('phone')} placeholder="+91 9876543210" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input {...register('password', {
              required: 'Password required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
              pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase & number' },
            })} type={showPw ? 'text' : 'password'} placeholder="••••••••" className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
              {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">Referral Code (optional)</label>
          <input {...register('referralCode')} placeholder="TSCT123456" className={inputClass} />
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-glow mt-2">
          {loading ? <><Spinner size="sm" /> Creating Account...</> : 'Create Account →'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Sign In</Link>
      </p>
    </AuthLayout>
  );
};

// ── OTP Page ──────────────────────────────────────────────────────────────────
export const OTPPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useReduxDispatch();
  const email = location.state?.email || '';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    text.forEach((c, i) => { if (/\d/.test(c)) newOtp[i] = c; });
    setOtp(newOtp);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Please enter all 6 digits'); return; }
    if (!email) { toast.error('Missing email. Please register again.'); navigate('/register'); return; }
    setLoading(true);
    try {
      const res = await authService.verifyOTP({ email, otp: otpStr });
      const { user, accessToken, refreshToken } = res.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Email verified! Welcome aboard 🎉');
      navigate(['admin', 'super_admin'].includes(user.role) ? '/admin' : '/dashboard', { replace: true });
    } catch {} finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP({ email });
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch {} finally { setResending(false); }
  };

  return (
    <AuthLayout title="Verify Your Email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div className="space-y-6">
        <div className="flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <input key={i}
              ref={el => refs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-all"
            />
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading || otp.join('').length !== 6}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-glow disabled:opacity-50">
          {loading ? <><Spinner size="sm" /> Verifying...</> : 'Verify OTP →'}
        </button>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-gray-400 text-sm">Resend OTP in <span className="text-primary-400 font-semibold">{countdown}s</span></p>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors">
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">← Back to Login</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset link sent!');
    } catch {} finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Forgot Password?" subtitle="No worries, we'll send you a reset link">
      {sent ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-4">📧</div>
          <p className="text-white font-semibold mb-2">Check your email!</p>
          <p className="text-gray-400 text-sm mb-6">We've sent a password reset link. It expires in 15 minutes.</p>
          <Link to="/login" className="btn-primary w-full block text-center py-3">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                type="email" placeholder="you@example.com" className={inputClass} />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-glow">
            {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Reset Link →'}
          </button>
          <p className="text-center">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-semibold">← Back to Login</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    if (!token || !email) { toast.error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await authService.resetPassword({ token, email, password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch {} finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Set New Password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">New Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input {...register('password', {
              required: 'Password required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
              pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase & number' },
            })} type={showPw ? 'text' : 'password'} placeholder="New password" className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">Confirm Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: v => v === watch('password') || 'Passwords do not match',
            })} type={showPw ? 'text' : 'password'} placeholder="Confirm password" className={inputClass} />
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-glow">
          {loading ? <><Spinner size="sm" /> Updating...</> : 'Reset Password →'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;

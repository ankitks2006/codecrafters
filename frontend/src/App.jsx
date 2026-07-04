import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from './redux/slices/uiSlice';
import { setCredentials, setTokens } from './redux/slices/index';
import { authService } from './services';
import LoadingScreen from './components/ui/LoadingScreen';
import SocketProvider from './context/SocketContext';

// Public pages
import LandingPage from './pages/public/LandingPage';
import CoursesPage from './pages/public/CoursesPage';
import CourseDetailPage from './pages/public/CourseDetailPage';
import InternshipsPage from './pages/public/InternshipsPage';
import InternshipDetailPage from './pages/public/InternshipDetailPage';
import BlogPage from './pages/public/BlogPage';
import BlogDetailPage from './pages/public/BlogDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import CertificateVerifyPage from './pages/public/CertificateVerifyPage';
import FAQPage from './pages/public/FAQPage';
import CareerPage from './pages/public/CareerPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import RefundPage from './pages/public/RefundPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPPage from './pages/auth/OTPPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Student dashboard (lazy loaded)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentCourses = lazy(() => import('./pages/student/MyCourses'));
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const StudentInternships = lazy(() => import('./pages/student/MyInternships'));
const StudentCertificates = lazy(() => import('./pages/student/MyCertificates'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentQuiz = lazy(() => import('./pages/student/Quiz'));
const QuizAttempt = lazy(() => import('./pages/student/QuizAttempt'));
const StudentPayments = lazy(() => import('./pages/student/Payments'));
const StudentTickets = lazy(() => import('./pages/student/SupportTickets'));
const StudentNotifications = lazy(() => import('./pages/student/Notifications'));
const StudentSettings = lazy(() => import('./pages/student/Settings'));
const ResumeBuilder = lazy(() => import('./pages/student/ResumeBuilder'));
const StudentLeaderboard = lazy(() => import('./pages/student/Leaderboard'));

// Admin dashboard (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminCourseForm = lazy(() => import('./pages/admin/CourseForm'));
const AdminInternships = lazy(() => import('./pages/admin/Internships'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCertificates = lazy(() => import('./pages/admin/Certificates'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminEnrollments = lazy(() => import('./pages/admin/Enrollments'));
const AdminAssignments = lazy(() => import('./pages/admin/Assignments'));
const AdminQuizzes = lazy(() => import('./pages/admin/Quizzes'));
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.ui);

  useEffect(() => {
    dispatch(setTheme(theme));
  }, []);

  // Handle OAuth redirect tokens (e.g., Google)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken) {
      dispatch(setTokens({ accessToken, refreshToken }));
      // fetch user profile
      authService.getMe().then((res) => {
        const user = res.data.data;
        dispatch(setCredentials({ user, accessToken, refreshToken }));
      }).catch(() => {});
      // clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Router>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
            success: { style: { background: '#10b981', color: '#fff' } },
            error: { style: { background: '#ef4444', color: '#fff' } },
          }}
        />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPage />} />
              <Route path="/internships" element={<InternshipsPage />} />
              <Route path="/internships/:slug" element={<InternshipDetailPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/career" element={<CareerPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/verify/:certificateId" element={<CertificateVerifyPage />} />
            </Route>

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Student dashboard */}
            <Route element={<ProtectedRoute roles={['student', 'admin', 'super_admin', 'trainer', 'hr']} />}>
              <Route element={<StudentLayout />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/dashboard/courses" element={<StudentCourses />} />
                <Route path="/dashboard/courses/:id/learn" element={<CoursePlayer />} />
                <Route path="/dashboard/internships" element={<StudentInternships />} />
                <Route path="/dashboard/certificates" element={<StudentCertificates />} />
                <Route path="/dashboard/profile" element={<StudentProfile />} />
                <Route path="/dashboard/assignments" element={<StudentAssignments />} />
                <Route path="/dashboard/quiz" element={<StudentQuiz />} />
                <Route path="/dashboard/quiz/:id/attempt" element={<QuizAttempt />} />
                <Route path="/dashboard/payments" element={<StudentPayments />} />
                <Route path="/dashboard/tickets" element={<StudentTickets />} />
                <Route path="/dashboard/notifications" element={<StudentNotifications />} />
                <Route path="/dashboard/settings" element={<StudentSettings />} />
                <Route path="/dashboard/resume" element={<ResumeBuilder />} />
                <Route path="/dashboard/leaderboard" element={<StudentLeaderboard />} />
              </Route>
            </Route>

            {/* Admin dashboard */}
            <Route element={<ProtectedRoute roles={['admin', 'super_admin', 'trainer', 'hr']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/courses/new" element={<AdminCourseForm />} />
                <Route path="/admin/courses/:id/edit" element={<AdminCourseForm />} />
                <Route path="/admin/internships" element={<AdminInternships />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/certificates" element={<AdminCertificates />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/enrollments" element={<AdminEnrollments />} />
                <Route path="/admin/assignments" element={<AdminAssignments />} />
                <Route path="/admin/quizzes" element={<AdminQuizzes />} />
                <Route path="/admin/blogs" element={<AdminBlogs />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SocketProvider>
    </Router>
  );
}

export default App;

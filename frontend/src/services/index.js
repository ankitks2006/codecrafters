import api from './api';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User Services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  getReferral: () => api.get('/users/referral'),
  getPublicProfile: (id) => api.get(`/users/${id}`),
};

// Course Services
export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getBySlug: (slug) => api.get(`/courses/${slug}`),
  getForAdmin: (id) => api.get(`/courses/admin/${id}`),
  getCategories: () => api.get('/courses/categories'),
  // getForStudent: (id) => api.get(`/courses/student/${id}`),
  // getCategories: () => api.get('/categories'),
  getCourseContent: (id) => api.get(`/courses/${id}/content`),
  create: (formData) => api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/courses/${id}`),
  addModule: (id, data) => api.post(`/courses/${id}/modules`, data),
  addLesson: (id, moduleId, formData) => api.post(`/courses/${id}/modules/${moduleId}/lessons`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProgress: (id, data) => api.post(`/courses/${id}/progress`, data),
  addReview: (id, data) => api.post(`/courses/${id}/reviews`, data),
};

// Internship Services
export const internshipService = {
  getAll: (params) => api.get('/internships', { params }),
  getBySlug: (slug) => api.get(`/internships/${slug}`),
  create: (data) => api.post('/internships', data),
  update: (id, data) => api.put(`/internships/${id}`, data),
  delete: (id) => api.delete(`/internships/${id}`),
  submitWeeklyReport: (id, data) => api.post(`/internships/${id}/weekly-report`, data),
};

// Enrollment Services
export const enrollmentService = {
  getMyEnrollments: (params) => api.get('/enrollments/my', { params }),
  enrollFree: (data) => api.post('/enrollments/enroll-free', data),
  getEnrollment: (id) => api.get(`/enrollments/${id}`),
  complete: (id) => api.put(`/enrollments/${id}/complete`),
  getAll: (params) => api.get('/enrollments', { params }),
};

// Payment Services
export const paymentService = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  validateCoupon: (data) => api.post('/payments/validate-coupon', data),
  getHistory: (params) => api.get('/payments/history', { params }),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

// Certificate Services
export const certificateService = {
  getMyCertificates: () => api.get('/certificates/my'),
  verify: (id) => api.get(`/certificates/verify/${id}`),
  download: (id) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
  generate: (data) => api.post('/certificates/generate', data),
  revoke: (id, data) => api.put(`/certificates/${id}/revoke`, data),
  getAll: (params) => api.get('/certificates', { params }),
};

// Assignment Services
export const assignmentService = {
  getMyAssignments: () => api.get('/assignments/my'),
  getCreatedByMe: (params) => api.get('/assignments/created/mine', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, formData) => api.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  gradeSubmission: (id, data) => api.put(`/assignments/submissions/${id}/grade`, data),
  getSubmissions: (id, params) => api.get(`/assignments/${id}/submissions`, { params }),
};

// Quiz Services
export const quizService = {
  getMyQuizzes: () => api.get('/quiz/my'),
  getCreatedByMe: (params) => api.get('/quiz/created/mine', { params }),
  getAttempt: (id) => api.get(`/quiz/${id}/attempt`),
  submit: (id, data) => api.post(`/quiz/${id}/submit`, data),
  getResults: (id) => api.get(`/quiz/${id}/results`),
  getLeaderboard: (id) => api.get(`/quiz/${id}/leaderboard`),
  create: (data) => api.post('/quiz', data),
  update: (id, data) => api.put(`/quiz/${id}`, data),
  delete: (id) => api.delete(`/quiz/${id}`),
};

// Notification Services
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  send: (data) => api.post('/notifications/send', data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Blog Services
export const blogService = {
  getAll: (params) => api.get('/blog', { params }),
  getBySlug: (slug) => api.get(`/blog/${slug}`),
  create: (formData) => api.post('/blog', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/blog/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/blog/${id}`),
  getCategories: () => api.get('/blog/meta/categories'),
};

// Support Services
export const supportService = {
  getMyTickets: (params) => api.get('/support/my', { params }),
  create: (data) => api.post('/support', data),
  getById: (id) => api.get(`/support/${id}`),
  reply: (id, data) => api.post(`/support/${id}/reply`, data),
  getAll: (params) => api.get('/support', { params }),
  updateStatus: (id, data) => api.put(`/support/${id}/status`, data),
};

// Admin Services
export const adminService = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getRevenue: (params) => api.get('/admin/analytics/revenue', { params }),
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserBlock: (id) => api.put(`/admin/users/${id}/block`),
  changeUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  sendBulkEmail: (data) => api.post('/admin/users/bulk-email', data),
  getSystemHealth: () => api.get('/admin/system/health'),
  getCategories: () => api.get('/admin/categories'),
  // getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getFaqs: () => api.get('/admin/faqs'),
  createFaq: (data) => api.post('/admin/faqs', data),
  updateFaq: (id, data) => api.put(`/admin/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/admin/faqs/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (data) => api.post('/admin/settings', data),
  getTestimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`),
};

// Media Services
export const mediaService = {
  upload: (formData, folder) => api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, params: { folder } }),
  delete: (publicId) => api.delete(`/media/${publicId}`),
};

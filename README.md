# ⚡ TheSkillCoder — Internship & Learning Management Platform

> India's premier full-stack LMS & Internship Platform built with MERN stack.

![Stack](https://img.shields.io/badge/Stack-MERN-6C63FF?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 🏗️ Architecture Overview

```
project/
├── frontend/          # React + Vite + Tailwind (→ Vercel)
└── backend/           # Node.js + Express + MongoDB (→ Render)
```

---

## ✨ Features

### 🎓 Student
- Dashboard with progress tracking, stats, streak
- Course enrollment, video player (YouTube + MEGA links)
- Assignment submission with Cloudinary file upload
- MCQ/Coding Quizzes with auto-evaluation & leaderboard
- QR-verified PDF certificates (auto-generated at 100% completion)
- Internship programs with weekly reports & mentor feedback
- Resume Builder
- Support ticket system
- Referral program with earnings
- Real-time notifications via Socket.io

### 👑 Admin
- Full analytics dashboard (revenue, user growth, course stats)
- Complete CRUD for courses, internships, users, blogs, FAQs
- Certificate management with revoke capability
- Payment management with Razorpay refunds
- Coupon code system with GST calculation
- Bulk email to users by role
- System health monitoring
- Assignment grading interface

### 🔐 Security
- JWT access + refresh tokens
- Role-based authorization (student, admin, trainer, hr, super_admin)
- Helmet, CORS, rate limiting, mongo sanitization
- Password hashing with bcrypt
- Email OTP verification

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account
- Cloudinary account
- Razorpay account
- Gmail account (for email)

### 1. Clone & Setup

```bash
git clone https://github.com/yourorg/theskillcoder.git
cd theskillcoder
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 4. Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health: http://localhost:5000/health

---

## 🔑 Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail app password |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `CERT_VERIFY_URL` | Certificate verify base URL |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## 📡 API Reference

### Auth
```
POST   /api/auth/register          Register new user
POST   /api/auth/verify-otp        Verify email OTP
POST   /api/auth/resend-otp        Resend OTP
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/refresh-token     Refresh access token
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password
GET    /api/auth/me                Get current user
PUT    /api/auth/change-password   Change password
```

### Courses
```
GET    /api/courses                List courses (public, paginated)
GET    /api/courses/:slug          Course detail
GET    /api/courses/:id/content    Full content (enrolled only)
POST   /api/courses/:id/progress   Update lesson progress
POST   /api/courses/:id/reviews    Submit review
POST   /api/courses               Create course (admin/trainer)
PUT    /api/courses/:id            Update course
DELETE /api/courses/:id            Delete course
POST   /api/courses/:id/modules            Add module
POST   /api/courses/:id/modules/:mid/lessons  Add lesson
```

### Payments
```
POST   /api/payments/create-order     Create Razorpay order
POST   /api/payments/verify           Verify & activate enrollment
POST   /api/payments/validate-coupon  Validate coupon
GET    /api/payments/history          Payment history
POST   /api/payments/:id/refund       Process refund (admin)
```

### Certificates
```
GET    /api/certificates/my           My certificates
GET    /api/certificates/verify/:id   Verify certificate (public)
GET    /api/certificates/:id/download Download certificate
POST   /api/certificates/generate     Generate certificate (admin)
PUT    /api/certificates/:id/revoke   Revoke certificate (admin)
```

### Enrollments
```
GET    /api/enrollments/my          My enrollments
POST   /api/enrollments/enroll-free Enroll in free course
GET    /api/enrollments/:id         Enrollment details
PUT    /api/enrollments/:id/complete Mark complete + issue cert
```

### Assignments
```
GET    /api/assignments/my          My assignments
GET    /api/assignments/:id         Assignment + my submission
POST   /api/assignments/:id/submit  Submit assignment (with files)
PUT    /api/assignments/submissions/:id/grade  Grade (trainer)
GET    /api/assignments/:id/submissions  All submissions (trainer)
```

### Quiz
```
GET    /api/quiz/my              My quizzes
GET    /api/quiz/:id/attempt     Quiz attempt (answers hidden)
POST   /api/quiz/:id/submit      Submit answers (auto-eval MCQ)
GET    /api/quiz/:id/results     My result history
GET    /api/quiz/:id/leaderboard Quiz leaderboard
```

### Notifications
```
GET    /api/notifications           My notifications (paginated)
PUT    /api/notifications/:id/read  Mark read
PUT    /api/notifications/mark-all-read  Mark all read
POST   /api/notifications/send      Send notification (admin)
```

### Support Tickets
```
GET    /api/support/my           My tickets
POST   /api/support              Create ticket
GET    /api/support/:id          Ticket detail with replies
POST   /api/support/:id/reply    Reply to ticket
GET    /api/support              All tickets (admin)
PUT    /api/support/:id/status   Update status (admin)
```

### Admin
```
GET    /api/admin/analytics/overview    Dashboard stats
GET    /api/admin/analytics/revenue     Revenue by month
GET    /api/admin/analytics/users       User growth analytics
GET    /api/admin/users                 All users (paginated)
PUT    /api/admin/users/:id/block       Block/unblock user
PUT    /api/admin/users/:id/role        Change role (super_admin)
POST   /api/admin/users/bulk-email      Send bulk email
GET    /api/admin/system/health         System health
GET/POST/PUT/DELETE /api/admin/categories   Category CRUD
GET/POST/PUT/DELETE /api/admin/faqs         FAQ CRUD
GET/POST            /api/admin/settings     Site settings
GET/POST/PUT/DELETE /api/admin/testimonials Testimonial CRUD
```

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `users` | All users with roles |
| `courses` | Courses with embedded modules & lessons |
| `internships` | Internship programs |
| `enrollments` | Student enrollments with progress |
| `certificates` | Generated certificates |
| `payments` | Razorpay payments & invoices |
| `assignments` | Assignment definitions |
| `assignmentsubmissions` | Student submissions |
| `quizzes` | Quiz with embedded questions |
| `quizresults` | Student quiz attempts |
| `notifications` | In-app notifications |
| `blogs` | Blog posts |
| `categories` | Content categories |
| `coupons` | Discount coupons |
| `supporttickets` | Support tickets with replies |
| `reviews` | Course/internship reviews |
| `testimonials` | Homepage testimonials |
| `faqs` | FAQ entries |
| `settings` | Site-wide settings (key-value) |
| `attendances` | Student attendance records |

---

<!-- ## ☁️ Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import in Vercel dashboard
3. Set environment variables from `.env.example`
4. Framework preset: **Vite**
5. Build: `npm run build` → Output: `dist`

### Backend → Render
1. Push `backend/` to GitHub
2. Create **Web Service** on Render
3. Build: `npm install` | Start: `node src/server.js`
4. Set all environment variables
5. Use `render.yaml` for automatic config

### Database → MongoDB Atlas
1. Create M0 free cluster
2. Add IP `0.0.0.0/0` to allow list
3. Create database user
4. Get connection string → set as `MONGODB_URI`

### Storage → Cloudinary
1. Create free account at cloudinary.com
2. Copy Cloud Name, API Key, API Secret
3. Set as Cloudinary env vars

---

## 🎬 Video Storage (MEGA)

Videos are **never** stored in MongoDB. Only metadata is stored:

```json
{
  "videoTitle": "Introduction to React",
  "videoDescription": "Learn React basics",
  "videoUrl": "https://mega.nz/file/xxxxx",
  "videoThumbnail": "https://res.cloudinary.com/...",
  "videoDuration": 1800
}
```

Upload videos to MEGA manually, copy the share link, paste it when creating lessons. -->

---
<!-- 
## 🔒 Certificate Verification

Every certificate has:
- Unique ID: `CCT-A1B2C3D4-K7M9P2`
- QR Code → `https://theskillcoder.com/verify/:certificateId`
- PDF with watermark, company branding, digital signature area
- Revocation support (shows INVALID CERTIFICATE when revoked)

---

## 🔌 Real-time Features (Socket.io)

| Event | Description |
|-------|-------------|
| `notification` | Real-time in-app notification |
| `live:started` | Live class started alert |
| `live:start` | Instructor starts live class |
| `user:online` / `user:offline` | Presence tracking |
| `ticket:typing` | Support chat typing indicator |

---

## 📅 Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Assignment reminders | Daily 9AM IST | Email students with assignments due tomorrow |
| Clean expired OTPs | Every 6 hours | Remove expired verification OTPs |
| Check enrollments | Daily midnight | Mark expired enrollments |

---

## 🛡️ Security Checklist

- [x] Helmet security headers
- [x] Rate limiting (100 req/15min; 10 auth/15min)
- [x] MongoDB injection sanitization
- [x] JWT rotate on refresh
- [x] Password hashing (bcrypt 12 rounds)
- [x] Email enumeration protection
- [x] CORS whitelist
- [x] File type/size validation
- [x] Input validation (express-validator)
- [x] Role-based route protection

---

## 📧 Email Templates

All emails are styled HTML with TheSkillCoder branding:

- OTP Verification
- Welcome Email
- Password Reset
- Payment Confirmation with invoice details
- Certificate Generated with download link
- Assignment Deadline Reminder
- Support Ticket Updates

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

## 📞 Support

- Email: support@theskillcoder.com
- Website: https://theskillcoder.com
- GitHub Issues: [Open an issue](https://github.com/yourorg/theskillcoder/issues)

---

<div align="center">
  <p>Made with ❤️ by TheSkillCoder Team</p>
  <p>⭐ Star this repo if it helped you!</p>
</div> -->

<!--email  vagadax478@heavty.com -->
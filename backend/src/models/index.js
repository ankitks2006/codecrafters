const mongoose = require('mongoose');

// ==================== Category ====================
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: String,
    icon: String,
    image: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    type: { type: String, enum: ['course', 'blog', 'internship', 'general'], default: 'general' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
categorySchema.pre('save', function (next) {
  if (this.isModified('name'))
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  next();
});

// ==================== Notification ====================
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isGlobal: { type: Boolean, default: false },
    roles: [String], // if targeting by role
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'announcement', 'course', 'internship', 'payment', 'certificate', 'assignment'],
      default: 'info',
    },
    link: String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    icon: String,
    expiresAt: Date,
  },
  { timestamps: true }
);
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// ==================== Blog ====================
const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    thumbnail: String,
    thumbnailPublicId: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [String],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    readingTime: { type: Number, default: 5 }, // in minutes
    viewCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    meta: { title: String, description: String, keywords: [String] },
    publishedAt: Date,
  },
  { timestamps: true }
);
blogSchema.pre('save', function (next) {
  if (this.isModified('title'))
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (this.isModified('content'))
    this.readingTime = Math.ceil(this.content.split(' ').length / 200);
  next();
});
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// ==================== Coupon ====================
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    value: { type: Number, required: true },
    maxDiscount: Number,
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    applicableTo: { type: String, enum: ['all', 'course', 'internship'], default: 'all' },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    internships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Internship' }],
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// ==================== Support Ticket ====================
const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['technical', 'payment', 'course', 'certificate', 'other'], default: 'other' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ url: String, publicId: String, name: String }],
    replies: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        attachments: [{ url: String, name: String }],
        createdAt: { type: Date, default: Date.now },
        isAdminReply: { type: Boolean, default: false },
      },
    ],
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);
ticketSchema.pre('save', function (next) {
  if (!this.ticketId)
    this.ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
  next();
});

// ==================== Attendance ====================
const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { timestamps: true }
);
attendanceSchema.index({ student: 1, date: 1 });

// ==================== Review ====================
const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, maxlength: 1000 },
    isPublished: { type: Boolean, default: true },
    helpful: { type: Number, default: 0 },
    adminReply: String,
  },
  { timestamps: true }
);

// ==================== Testimonial ====================
const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: String,
    company: String,
    avatar: String,
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ==================== FAQ ====================
const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: String,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ==================== Settings ====================
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
    description: String,
    isPublic: { type: Boolean, default: false },
    group: { type: String, default: 'general' },
  },
  { timestamps: true }
);

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Blog: mongoose.model('Blog', blogSchema),
  Coupon: mongoose.model('Coupon', couponSchema),
  SupportTicket: mongoose.model('SupportTicket', ticketSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Review: mongoose.model('Review', reviewSchema),
  Testimonial: mongoose.model('Testimonial', testimonialSchema),
  FAQ: mongoose.model('FAQ', faqSchema),
  Settings: mongoose.model('Settings', settingsSchema),
};

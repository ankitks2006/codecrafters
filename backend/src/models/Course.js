const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoTitle: String,
  videoDescription: String,
  videoUrl: String, // MEGA link
  videoDuration: Number, // in seconds
  videoThumbnail: String,
  notes: String,
  notesUrl: String, // Cloudinary PDF
  resources: [
    {
      title: String,
      url: String,
      type: { type: String, enum: ['pdf', 'link', 'doc', 'other'] },
    },
  ],
  order: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  lessons: [lessonSchema],
  isPublished: { type: Boolean, default: true },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    thumbnail: { type: String, required: true },
    thumbnailPublicId: String,
    banner: String,
    bannerPublicId: String,
    previewVideo: String, // MEGA link
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, default: 'English' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all_levels'], default: 'beginner' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    offerEndsAt: Date,
    currency: { type: String, default: 'INR' },
    duration: { type: Number, default: 0 }, // total hours
    totalLessons: { type: Number, default: 0 },
    totalModules: { type: Number, default: 0 },
    modules: [moduleSchema],
    tags: [String],
    requirements: [String],
    objectives: [String],
    targetAudience: [String],
    hasCertificate: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    gstIncluded: { type: Boolean, default: true },
    gstPercent: { type: Number, default: 18 },
    meta: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto slug from title
courseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Calculate totals
  this.totalModules = this.modules.length;
  this.totalLessons = this.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  next();
});

courseSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, status: 1, isPublished: 1 });
courseSchema.index({ instructor: 1 });

module.exports = mongoose.model('Course', courseSchema);

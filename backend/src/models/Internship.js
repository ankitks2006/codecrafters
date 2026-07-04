const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    thumbnail: String,
    thumbnailPublicId: String,
    banner: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    duration: { type: Number, required: true }, // in weeks
    startDate: Date,
    endDate: Date,
    type: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'remote' },
    stipend: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    requirements: [String],
    responsibilities: [String],
    skills: [String],
    selectionProcess: [
      {
        step: Number,
        title: String,
        description: String,
      },
    ],
    projects: [
      {
        title: String,
        description: String,
        techStack: [String],
      },
    ],
    benefits: [String],
    hasCertificate: { type: Boolean, default: true },
    hasLetterOfRecommendation: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 50 },
    enrollmentCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'active', 'completed', 'archived'], default: 'upcoming' },
    tags: [String],
    meta: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

internshipSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

internshipSchema.index({ title: 'text', description: 'text' });
internshipSchema.index({ status: 1, isPublished: 1 });

module.exports = mongoose.model('Internship', internshipSchema);

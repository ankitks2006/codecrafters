const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      default: () => `TSCT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['course', 'internship'], required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    title: { type: String, required: true }, // "Certificate of Completion" etc
    courseName: String,
    internshipName: String,
    instructorName: String,
    duration: String,
    issueDate: { type: Date, default: Date.now },
    expiryDate: Date,
    pdfUrl: String, // Cloudinary URL
    pdfPublicId: String,
    qrCode: String, // Base64 QR or URL
    verificationUrl: String,
    status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
    revokedAt: Date,
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokeReason: String,
    downloadCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, type: 1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);

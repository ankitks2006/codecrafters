const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['course', 'internship'], required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: { type: Number, required: true }, // in paise
    amountInRupees: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'created',
    },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    originalAmount: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: String,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date,
    refundReason: String,
    paidAt: Date,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Generate invoice number
paymentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'captured' && !this.invoiceNumber) {
    const date = new Date();
    this.invoiceNumber = `CCT-INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${this._id.toString().slice(-6).toUpperCase()}`;
    this.paidAt = new Date();
  }
  next();
});

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

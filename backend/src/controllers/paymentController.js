const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Internship = require('../models/Internship');
const { Coupon, Notification } = require('../models/index');
const emailService = require('../services/emailService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { type, itemId, couponCode } = req.body;

    let item, price, gstAmount, totalAmount;

    if (type === 'course') {
      item = await Course.findById(itemId);
    } else if (type === 'internship') {
      item = await Internship.findById(itemId);
    }
    if (!item) return ApiResponse.notFound(res, `${type} not found`);

    // Check already enrolled for this exact item
    const query = { student: req.user._id, type };
    query[type] = itemId;
    const existing = await Enrollment.findOne(query);
    if (existing && !['expired', 'refunded'].includes(existing.status)) {
      return ApiResponse.error(res, `You are already enrolled in this ${type}`, 409);
    }

    const basePrice = item.discountPrice > 0 ? item.discountPrice : item.price;
    if (basePrice === 0) {
      return ApiResponse.error(res, 'This item is free. Enroll directly without payment.', 400);
    }

    // Apply coupon
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) return ApiResponse.error(res, 'Invalid coupon code', 400);
      if (new Date() > coupon.validUntil) return ApiResponse.error(res, 'Coupon has expired', 400);
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return ApiResponse.error(res, 'Coupon usage limit reached', 400);
      if (coupon.usedBy.includes(req.user._id)) return ApiResponse.error(res, 'You have already used this coupon', 400);
      if (basePrice < coupon.minOrderAmount) return ApiResponse.error(res, `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);

      discountAmount = coupon.type === 'percent'
        ? Math.min((basePrice * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : coupon.value;
      discountAmount = Math.min(discountAmount, basePrice);
    }

    price = basePrice - discountAmount;
    gstAmount = Math.round(price * 0.18); // 18% GST
    totalAmount = price + gstAmount;

    const amountInPaise = Math.round(totalAmount * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        studentId: req.user._id.toString(),
        type,
        itemId,
        couponCode: couponCode || '',
      },
    });

    const payment = await Payment.create({
      student: req.user._id,
      type,
      course: type === 'course' ? itemId : undefined,
      internship: type === 'internship' ? itemId : undefined,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      amountInRupees: totalAmount,
      currency: 'INR',
      originalAmount: basePrice,
      discountAmount,
      gstAmount,
      gstPercent: 18,
      coupon: coupon?._id,
      couponCode: couponCode,
    });

    return ApiResponse.success(res, {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      itemName: item.title,
      breakdown: { basePrice, discountAmount, gstAmount, totalAmount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment and activate enrollment
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return ApiResponse.error(res, 'Payment verification failed. Invalid signature.', 400);
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return ApiResponse.notFound(res, 'Payment record not found');
    if (payment.student.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'captured';
    await payment.save();

    // Update coupon usage
    if (payment.coupon) {
      await Coupon.findByIdAndUpdate(payment.coupon, {
        $inc: { usageCount: 1 },
        $push: { usedBy: req.user._id },
      });
    }

    const enrollmentQuery = {
      student: req.user._id,
      type: payment.type,
    };
    if (payment.type === 'course') enrollmentQuery.course = payment.course;
    if (payment.type === 'internship') enrollmentQuery.internship = payment.internship;

    let enrollment = await Enrollment.findOne(enrollmentQuery);
    const shouldIncrement = !enrollment || ['expired', 'refunded'].includes(enrollment.status);

    if (enrollment) {
      enrollment.payment = payment._id;
      enrollment.status = 'active';
      enrollment.enrolledAt = new Date();
      enrollment.progress = 0;
      enrollment.completedAt = undefined;
      enrollment.certificateIssued = false;
      enrollment.certificate = undefined;
      if (payment.type === 'internship') enrollment.internshipStatus = 'enrolled';
      await enrollment.save();
    } else {
      const enrollmentData = {
        student: req.user._id,
        type: payment.type,
        payment: payment._id,
        status: 'active',
      };
      if (payment.type === 'course') enrollmentData.course = payment.course;
      if (payment.type === 'internship') enrollmentData.internship = payment.internship;
      enrollment = await Enrollment.create(enrollmentData);
    }

    // Update enrollment count only when activating a fresh or reactivated enrollment
    if (shouldIncrement) {
      const countField = { enrollmentCount: 1 };
      if (payment.type === 'course') await Course.findByIdAndUpdate(payment.course, { $inc: countField });
      if (payment.type === 'internship') await Internship.findByIdAndUpdate(payment.internship, { $inc: countField });
    }

    // Get item name for email
    let itemName = 'your course/internship';
    if (payment.type === 'course') {
      const course = await Course.findById(payment.course).select('title');
      itemName = course?.title;
    } else {
      const internship = await Internship.findById(payment.internship).select('title');
      itemName = internship?.title;
    }

    // Send confirmation email
    await emailService.sendPaymentSuccess(req.user.email, req.user.firstName, {
      itemName,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amountInRupees,
      paymentId: razorpay_payment_id,
    }).catch(() => {});

    // In-app notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Payment Successful! 🎉',
      message: `Your enrollment in "${itemName}" is confirmed.`,
      type: 'payment',
      link: `/dashboard/${payment.type === 'course' ? 'courses' : 'internships'}`,
    });

    logger.info(`Payment verified: ${razorpay_payment_id} for user ${req.user.email}`);

    return ApiResponse.success(res, {
      enrollmentId: enrollment._id,
      paymentId: payment._id,
      invoiceNumber: payment.invoiceNumber,
    }, 'Payment verified and enrollment activated');
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const query = req.user.role === 'student' ? { student: req.user._id } : {};

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('student', 'firstName lastName email')
        .populate('course', 'title thumbnail')
        .populate('internship', 'title thumbnail')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    return ApiResponse.paginated(res, payments, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon
// @route   POST /api/payments/validate-coupon
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return ApiResponse.error(res, 'Invalid coupon code', 400);
    if (new Date() > coupon.validUntil) return ApiResponse.error(res, 'Coupon has expired', 400);
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return ApiResponse.error(res, 'Coupon usage limit reached', 400);
    if (coupon.usedBy.includes(req.user._id)) return ApiResponse.error(res, 'Coupon already used', 400);
    if (amount < coupon.minOrderAmount) return ApiResponse.error(res, `Minimum amount: ₹${coupon.minOrderAmount}`, 400);

    const discount = coupon.type === 'percent'
      ? Math.min((amount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

    return ApiResponse.success(res, {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.min(discount, amount),
      description: coupon.description,
    }, 'Coupon applied successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Request refund (Admin)
// @route   POST /api/payments/:id/refund
exports.processRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found');
    if (payment.status !== 'captured') return ApiResponse.error(res, 'Payment cannot be refunded', 400);

    const refund = await getRazorpay().payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      notes: { reason },
    });

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount / 100;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();

    // Deactivate enrollment
    await Enrollment.findOneAndUpdate(
      { payment: payment._id },
      { status: 'refunded' }
    );

    return ApiResponse.success(res, { refundId: refund.id }, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

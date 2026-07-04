const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/create-order', authenticate, [
  body('type').isIn(['course', 'internship']),
  body('itemId').notEmpty(),
], validate, paymentController.createOrder);

router.post('/verify', authenticate, [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('paymentId').notEmpty(),
], validate, paymentController.verifyPayment);

router.post('/validate-coupon', authenticate, paymentController.validateCoupon);
router.get('/history', authenticate, paymentController.getPaymentHistory);
router.post('/:id/refund', authenticate, isAdmin, paymentController.processRefund);

module.exports = router;

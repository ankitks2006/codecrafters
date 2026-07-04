const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// Analytics
router.get('/analytics/overview', adminController.getDashboardOverview);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.toggleUserBlock);
router.put('/users/:id/role', isSuperAdmin, adminController.changeUserRole);
router.post('/users/bulk-email', adminController.sendBulkEmail);

// System
router.get('/system/health', adminController.getSystemHealth);

// Categories CRUD
const { Category, FAQ, Testimonial, Settings } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');

router.get('/categories', async (req, res, next) => {
  try {
    const cats = await Category.find().sort('order name');
    return ApiResponse.success(res, cats);
  } catch (e) { next(e); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    return ApiResponse.created(res, cat);
  } catch (e) { next(e); }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return ApiResponse.notFound(res, 'Category not found');
    return ApiResponse.success(res, cat);
  } catch (e) { next(e); }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Deleted');
  } catch (e) { next(e); }
});

// FAQ
router.get('/faqs', async (req, res, next) => {
  try {
    const faqs = await FAQ.find().sort('order');
    return ApiResponse.success(res, faqs);
  } catch (e) { next(e); }
});
router.post('/faqs', async (req, res, next) => {
  try {
    const faq = await FAQ.create(req.body);
    return ApiResponse.created(res, faq);
  } catch (e) { next(e); }
});
router.put('/faqs/:id', async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return ApiResponse.success(res, faq);
  } catch (e) { next(e); }
});
router.delete('/faqs/:id', async (req, res, next) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Deleted');
  } catch (e) { next(e); }
});

// Settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await Settings.find();
    return ApiResponse.success(res, settings);
  } catch (e) { next(e); }
});
router.post('/settings', async (req, res, next) => {
  try {
    const { key, value, type, description, group, isPublic } = req.body;
    const setting = await Settings.findOneAndUpdate({ key }, { value, type, description, group, isPublic }, { new: true, upsert: true });
    return ApiResponse.success(res, setting);
  } catch (e) { next(e); }
});

// Testimonials
const { Testimonial: TestimonialModel } = require('../models/index');
router.get('/testimonials', async (req, res, next) => {
  try {
    const t = await TestimonialModel.find().sort('-createdAt');
    return ApiResponse.success(res, t);
  } catch (e) { next(e); }
});
router.post('/testimonials', async (req, res, next) => {
  try {
    const t = await TestimonialModel.create(req.body);
    return ApiResponse.created(res, t);
  } catch (e) { next(e); }
});
router.put('/testimonials/:id', async (req, res, next) => {
  try {
    const t = await TestimonialModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return ApiResponse.success(res, t);
  } catch (e) { next(e); }
});
router.delete('/testimonials/:id', async (req, res, next) => {
  try {
    await TestimonialModel.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Deleted');
  } catch (e) { next(e); }
});

module.exports = router;

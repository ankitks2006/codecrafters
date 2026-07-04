// blogs.js
const express = require('express');
const router = express.Router();
const { Blog, Category } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');
const { imageUpload, uploadToCloudinaryBuffer } = require('../middleware/upload');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 9, category, search, isFeatured, tag } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;
    if (isFeatured) query.isFeatured = true;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };
    const skip = (page - 1) * limit;
    const [blogs, total] = await Promise.all([
      Blog.find(query).populate('author', 'firstName lastName avatar').populate('category', 'name slug').select('-content').sort('-publishedAt').skip(skip).limit(Number(limit)),
      Blog.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, blogs, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'firstName lastName avatar bio').populate('category', 'name slug');
    if (!blog) return ApiResponse.notFound(res, 'Blog not found');
    blog.viewCount += 1;
    await blog.save({ validateBeforeSave: false });
    return ApiResponse.success(res, blog);
  } catch (e) { next(e); }
});

router.post('/', authenticate, isAdmin, upload.single('thumbnail'), async (req, res, next) => {
  try {
    const data = { ...req.body, author: req.user._id };
    if (req.file) {
      const result = await uploadToCloudinaryBuffer(req.file.buffer, 'blogs');
      data.thumbnail = result.secure_url;
      data.thumbnailPublicId = result.public_id;
    }
    if (data.status === 'published') data.publishedAt = new Date();
    const blog = await Blog.create(data);
    return ApiResponse.created(res, blog);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, isAdmin, upload.single('thumbnail'), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinaryBuffer(req.file.buffer, 'blogs');
      data.thumbnail = result.secure_url;
      data.thumbnailPublicId = result.public_id;
    }
    if (data.status === 'published' && !req.body.publishedAt) data.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!blog) return ApiResponse.notFound(res, 'Blog not found');
    return ApiResponse.success(res, blog, 'Blog updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Blog deleted');
  } catch (e) { next(e); }
});

// Public categories
router.get('/meta/categories', async (req, res, next) => {
  try {
    const cats = await Category.find({ type: 'blog', isActive: true });
    return ApiResponse.success(res, cats);
  } catch (e) { next(e); }
});

module.exports = router;

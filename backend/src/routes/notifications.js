const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get my notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = {
      $or: [
        { recipient: req.user._id },
        { isGlobal: true },
        { roles: req.user.role },
      ],
      ...(unreadOnly === 'true' && { isRead: false }),
    };
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);
    return ApiResponse.paginated(res, notifications, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit), unreadCount });
  } catch (e) { next(e); }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ recipient: req.user._id }, { isGlobal: true }] },
      { isRead: true, readAt: new Date() }
    );
    return ApiResponse.success(res, null, 'Marked as read');
  } catch (e) { next(e); }
});

// Mark all as read
router.put('/mark-all-read', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ recipient: req.user._id }, { isGlobal: true }], isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
});

// Admin: Send notification
router.post('/send', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { recipientId, isGlobal, roles, title, message, type, link } = req.body;
    const notif = await Notification.create({
      recipient: recipientId || undefined,
      isGlobal: isGlobal || false,
      roles: roles || [],
      title, message, type: type || 'info', link,
      sender: req.user._id,
    });
    // Emit via socket if needed
    const io = req.app.get('io');
    if (io) {
      if (isGlobal) io.emit('notification', notif);
      else if (recipientId) io.to(recipientId.toString()).emit('notification', notif);
    }
    return ApiResponse.created(res, notif, 'Notification sent');
  } catch (e) { next(e); }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    return ApiResponse.success(res, null, 'Deleted');
  } catch (e) { next(e); }
});

module.exports = router;

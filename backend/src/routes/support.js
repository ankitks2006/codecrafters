const express = require('express');
const router = express.Router();
const { SupportTicket } = require('../models/index');
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Get my tickets
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { student: req.user._id };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).populate('assignedTo', 'firstName lastName').sort('-createdAt').skip(skip).limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, tickets, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// Create ticket
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    const ticket = await SupportTicket.create({ student: req.user._id, subject, description, category, priority });
    return ApiResponse.created(res, ticket, 'Support ticket created. We will respond within 24 hours.');
  } catch (e) { next(e); }
});

// Get single ticket
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'student') query.student = req.user._id;
    const ticket = await SupportTicket.findOne(query)
      .populate('student', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .populate('replies.sender', 'firstName lastName avatar role');
    if (!ticket) return ApiResponse.notFound(res, 'Ticket not found');
    return ApiResponse.success(res, ticket);
  } catch (e) { next(e); }
});

// Reply to ticket
router.post('/:id/reply', authenticate, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('student', 'firstName lastName email');
    if (!ticket) return ApiResponse.notFound(res, 'Ticket not found');

    const isAdmin = ['admin', 'super_admin', 'hr'].includes(req.user.role);
    if (!isAdmin && ticket.student._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    ticket.replies.push({
      sender: req.user._id,
      message: req.body.message,
      isAdminReply: isAdmin,
    });

    if (isAdmin && ticket.status === 'open') ticket.status = 'in_progress';
    if (isAdmin && ticket.assignedTo?.toString() !== req.user._id.toString() && !ticket.assignedTo) {
      ticket.assignedTo = req.user._id;
    }

    await ticket.save();

    // Email notification
    if (isAdmin) {
      await emailService.sendTicketUpdate(
        ticket.student.email, ticket.student.firstName,
        ticket.ticketId, ticket.status, req.body.message
      ).catch(() => {});
    }

    return ApiResponse.success(res, null, 'Reply sent');
  } catch (e) { next(e); }
});

// Admin: get all tickets
router.get('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).populate('student', 'firstName lastName email').populate('assignedTo', 'firstName lastName').sort('-createdAt').skip(skip).limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);
    return ApiResponse.paginated(res, tickets, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// Admin: update ticket status
router.put('/:id/status', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { status, assignedTo } = req.body;
    const update = { status };
    if (assignedTo) update.assignedTo = assignedTo;
    if (status === 'resolved') update.resolvedAt = new Date();
    if (status === 'closed') update.closedAt = new Date();
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true }).populate('student', 'firstName lastName email');
    if (!ticket) return ApiResponse.notFound(res, 'Ticket not found');
    await emailService.sendTicketUpdate(ticket.student.email, ticket.student.firstName, ticket.ticketId, status, null).catch(() => {});
    return ApiResponse.success(res, ticket, 'Ticket updated');
  } catch (e) { next(e); }
});

module.exports = router;

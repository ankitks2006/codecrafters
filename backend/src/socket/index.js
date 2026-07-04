const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const logger = require('../utils/logger');

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('firstName lastName role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.firstName} (${socket.user.role})`);

    // Join personal room
    socket.join(socket.user._id.toString());
    // Join role room
    socket.join(`role:${socket.user.role}`);

    // Online presence
    socket.broadcast.emit('user:online', { userId: socket.user._id });

    socket.on('join:course', (courseId) => {
      socket.join(`course:${courseId}`);
    });

    socket.on('leave:course', (courseId) => {
      socket.leave(`course:${courseId}`);
    });

    // Live class notification
    socket.on('live:start', (data) => {
      if (['admin', 'trainer', 'super_admin'].includes(socket.user.role)) {
        io.to(`course:${data.courseId}`).emit('live:started', {
          courseId: data.courseId,
          title: data.title,
          instructor: socket.user.firstName,
          link: data.link,
        });
      }
    });

    // Typing indicators for support chat
    socket.on('ticket:typing', (ticketId) => {
      socket.to(`ticket:${ticketId}`).emit('ticket:typing', { userId: socket.user._id });
    });

    socket.on('join:ticket', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user.firstName}`);
      socket.broadcast.emit('user:offline', { userId: socket.user._id });
    });
  });

  return io;
};

module.exports = setupSocket;

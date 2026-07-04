const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

console.log("Email Config - Host:", process.env.EMAIL_HOST, "Port:", process.env.EMAIL_PORT, "User:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Verify Error:", error);
  } else {
    console.log("SMTP Server is ready");
  }
});

const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6C63FF 0%, #4f46e5 100%); padding: 32px 40px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 36px 40px; color: #374151; }
  .body h2 { color: #1f2937; font-size: 20px; margin-top: 0; }
  .otp-box { background: #f0f4ff; border: 2px dashed #6C63FF; border-radius: 10px; text-align: center; padding: 20px; margin: 24px 0; }
  .otp-code { font-size: 42px; font-weight: 700; color: #6C63FF; letter-spacing: 8px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #6C63FF, #4f46e5); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; font-size: 16px; }
  .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
`;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Code Crafters Tech</title>
<style>${emailStyles}</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>⚡ Code Crafters Tech</h1>
    <p>Internship & Learning Management Platform</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Code Crafters Tech. All rights reserved.</p>
    <p>You received this email because you registered on our platform.</p>
    <p>If you did not perform this action, please contact <a href="mailto:support@codecrafterstech.com">support@codecrafterstech.com</a></p>
  </div>
</div>
</body>
</html>`;

const templates = {
  otpVerification: (name, otp) =>
    baseTemplate(`
      <h2>Hello, ${name}! 👋</h2>
      <p>Thank you for registering with Code Crafters Tech. Please verify your email address using the OTP below:</p>
      <div class="otp-box">
        <p style="margin:0;color:#6b7280;font-size:14px;margin-bottom:8px;">Your verification code</p>
        <div class="otp-code">${otp}</div>
        <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">This code expires in 10 minutes</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
    `),

  welcomeEmail: (name) =>
    baseTemplate(`
      <h2>Welcome to Code Crafters Tech, ${name}! 🎉</h2>
      <p>Your account has been successfully verified. You're now ready to start your learning journey!</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Browse our courses and internship programs</li>
        <li>Build your profile and resume</li>
        <li>Track your progress and earn certificates</li>
        <li>Join our coding practice and quizzes</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
    `),

  resetPassword: (name, link) =>
    baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>Hello, ${name}. We received a request to reset your password.</p>
      <p>Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
      <a href="${link}" class="btn">Reset Password →</a>
      <hr class="divider">
      <p style="color:#9ca3af;font-size:13px;">If you didn't request a password reset, you can safely ignore this email.</p>
    `),

  paymentSuccess: (name, details) =>
    baseTemplate(`
      <h2>Payment Successful! 🎊</h2>
      <p>Hello, ${name}. Your payment has been received successfully.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
        <div class="info-row"><span>Course/Program:</span><strong>${details.itemName}</strong></div>
        <div class="info-row"><span>Invoice No:</span><strong>${details.invoiceNumber}</strong></div>
        <div class="info-row"><span>Amount Paid:</span><strong>₹${details.amount}</strong></div>
        <div class="info-row"><span>Payment ID:</span><code>${details.paymentId}</code></div>
        <div class="info-row"><span>Date:</span><strong>${new Date().toLocaleDateString('en-IN')}</strong></div>
        <div class="info-row" style="border:none"><span>Status:</span><span class="badge">✓ Paid</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/payments" class="btn">View Invoice →</a>
    `),

  certificateGenerated: (name, details) =>
    baseTemplate(`
      <h2>Congratulations! 🏆 Your Certificate is Ready</h2>
      <p>Hello, ${name}. You have successfully completed <strong>${details.courseName}</strong>.</p>
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="font-size:32px;margin:0;">🎓</p>
        <h3 style="color:#15803d;margin:8px 0;">Certificate of Completion</h3>
        <p style="color:#166534;margin:0;">Certificate ID: <strong>${details.certificateId}</strong></p>
      </div>
      <a href="${process.env.FRONTEND_URL}/certificates/${details.certificateId}" class="btn">Download Certificate →</a>
      <p style="color:#6b7280;font-size:13px;">You can verify this certificate at: ${process.env.CERT_VERIFY_URL}/${details.certificateId}</p>
    `),

  assignmentReminder: (name, details) =>
    baseTemplate(`
      <h2>Assignment Deadline Reminder ⏰</h2>
      <p>Hello, ${name}. This is a reminder that your assignment is due soon.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin:20px 0;">
        <p><strong>Assignment:</strong> ${details.assignmentTitle}</p>
        <p><strong>Course:</strong> ${details.courseName}</p>
        <p><strong>Deadline:</strong> ${new Date(details.deadline).toLocaleString('en-IN')}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/assignments" class="btn">Submit Assignment →</a>
    `),

  ticketUpdate: (name, ticketId, status, reply) =>
    baseTemplate(`
      <h2>Support Ticket Update</h2>
      <p>Hello, ${name}. Your support ticket has been updated.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Status:</strong> <span class="badge">${status}</span></p>
        ${reply ? `<p><strong>Reply:</strong> ${reply}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/tickets" class="btn">View Ticket →</a>
    `),
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    throw error;
  }
};

const emailService = {
  sendOTP: (email, name, otp) =>
    sendEmail({ to: email, subject: 'Verify Your Email - Code Crafters Tech', html: templates.otpVerification(name, otp) }),

  sendWelcome: (email, name) =>
    sendEmail({ to: email, subject: 'Welcome to Code Crafters Tech! 🎉', html: templates.welcomeEmail(name) }),

  sendPasswordReset: (email, name, link) =>
    sendEmail({ to: email, subject: 'Reset Your Password - Code Crafters Tech', html: templates.resetPassword(name, link) }),

  sendPaymentSuccess: (email, name, details) =>
    sendEmail({ to: email, subject: '✅ Payment Confirmed - Code Crafters Tech', html: templates.paymentSuccess(name, details) }),

  sendCertificate: (email, name, details) =>
    sendEmail({ to: email, subject: '🏆 Your Certificate is Ready - Code Crafters Tech', html: templates.certificateGenerated(name, details) }),

  sendAssignmentReminder: (email, name, details) =>
    sendEmail({ to: email, subject: '⏰ Assignment Due Soon - Code Crafters Tech', html: templates.assignmentReminder(name, details) }),

  sendTicketUpdate: (email, name, ticketId, status, reply) =>
    sendEmail({ to: email, subject: `Ticket ${ticketId} Updated - Code Crafters Tech`, html: templates.ticketUpdate(name, ticketId, status, reply) }),
};

module.exports = emailService;
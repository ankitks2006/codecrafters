const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const { cloudinary } = require('../config/cloudinary');
const Certificate = require('../models/Certificate');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const generateQRCode = async (url) => {
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 1,
    width: 150,
    color: { dark: '#1e1b4b', light: '#ffffff' },
  });
  return qrBuffer;
};

const generateCertificatePDF = async (certificateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const verificationUrl = `${process.env.CERT_VERIFY_URL}/${certificateData.certificateId}`;
      const qrBuffer = await generateQRCode(verificationUrl);

      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = 841.89;
      const H = 595.28;

      // --- Background gradient ---
      doc.rect(0, 0, W, H).fill('#0f0e17');

      // Decorative elements
      doc.circle(0, 0, 200).fill('#1e1b4b');
      doc.circle(W, H, 220).fill('#1e1b4b');

      // Gold border frame
      doc.rect(20, 20, W - 40, H - 40).lineWidth(2).stroke('#d4af37');
      doc.rect(25, 25, W - 50, H - 50).lineWidth(0.5).stroke('#d4af37');

      // Top decorative bar
      doc.rect(20, 20, W - 40, 6).fill('#d4af37');
      doc.rect(20, H - 26, W - 40, 6).fill('#d4af37');

      // Header - Company name
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#d4af37').text('CODE CRAFTERS TECH', 0, 50, {
        align: 'center',
        width: W,
        characterSpacing: 4,
      });

      // Subtitle
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af').text('INTERNSHIP & LEARNING MANAGEMENT PLATFORM', 0, 68, {
        align: 'center',
        width: W,
        characterSpacing: 2,
      });

      // Horizontal divider
      doc.moveTo(200, 90).lineTo(W - 200, 90).lineWidth(0.5).stroke('#d4af37');

      // Main title
      doc.font('Helvetica-Bold').fontSize(36).fillColor('#ffffff').text('CERTIFICATE', 0, 108, {
        align: 'center',
        width: W,
        characterSpacing: 6,
      });

      doc.font('Helvetica').fontSize(14).fillColor('#d4af37').text('OF COMPLETION', 0, 152, {
        align: 'center',
        width: W,
        characterSpacing: 3,
      });

      // Presented to text
      doc.font('Helvetica').fontSize(12).fillColor('#9ca3af').text('THIS IS PROUDLY PRESENTED TO', 0, 188, {
        align: 'center',
        width: W,
        characterSpacing: 2,
      });

      // Student Name
      doc.font('Helvetica-Bold').fontSize(34).fillColor('#d4af37').text(certificateData.studentName, 0, 210, {
        align: 'center',
        width: W,
      });

      // Decorative underline for name
      const nameWidth = doc.widthOfString(certificateData.studentName);
      const nameX = (W - nameWidth) / 2;
      doc.moveTo(nameX, 255).lineTo(nameX + nameWidth, 255).lineWidth(1).stroke('#d4af37');

      // For completing
      doc.font('Helvetica').fontSize(12).fillColor('#e5e7eb').text('has successfully completed the', 0, 270, {
        align: 'center',
        width: W,
      });

      // Course/Internship Name
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text(certificateData.courseName || certificateData.internshipName, 80, 295, {
        align: 'center',
        width: W - 160,
      });

      // Duration
      doc.font('Helvetica').fontSize(11).fillColor('#9ca3af').text(`Duration: ${certificateData.duration}`, 0, 340, {
        align: 'center',
        width: W,
      });

      // Signatures row
      const sigY = 395;
      const sig1X = 140;
      const sig2X = W - 250;

      // Signature lines
      doc.moveTo(sig1X, sigY).lineTo(sig1X + 160, sigY).lineWidth(1).stroke('#4b5563');
      doc.moveTo(sig2X, sigY).lineTo(sig2X + 160, sigY).lineWidth(1).stroke('#4b5563');

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#d4af37').text(certificateData.instructorName || 'Instructor', sig1X, sigY + 6, { width: 160, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af').text('INSTRUCTOR / MENTOR', sig1X, sigY + 20, { width: 160, align: 'center', characterSpacing: 1 });

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#d4af37').text('Director, Code Crafters Tech', sig2X, sigY + 6, { width: 160, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af').text('AUTHORIZED SIGNATORY', sig2X, sigY + 20, { width: 160, align: 'center', characterSpacing: 1 });

      // QR Code
      const qrX = W / 2 - 40;
      const qrY = sigY - 10;
      doc.image(qrBuffer, qrX, qrY, { width: 80, height: 80 });
      doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text('Scan to verify', qrX - 4, qrY + 84, { width: 88, align: 'center' });

      // Certificate ID and date - bottom
      const bottomY = H - 55;
      doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
        .text(`Certificate ID: ${certificateData.certificateId}`, 60, bottomY)
        .text(`Issue Date: ${new Date(certificateData.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, bottomY + 12)
        .text(`Verify at: ${verificationUrl}`, 60, bottomY + 24);

      // Watermark
      doc.save();
      doc.rotate(-45, { origin: [W / 2, H / 2] });
      doc.font('Helvetica-Bold').fontSize(72).fillColor('#d4af37').opacity(0.04)
        .text('CODE CRAFTERS TECH', W / 2 - 250, H / 2 - 36);
      doc.restore();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const uploadCertificatePDF = async (pdfBuffer, certificateId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'codecrafterstech/certificates',
        public_id: `cert_${certificateId}`,
        resource_type: 'raw',
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readable = new Readable();
    readable.push(pdfBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

const certificateService = {
  generate: async ({ student, type, course, internship, enrollment, instructor }) => {
    try {
      const itemName = course ? course.title : internship.title;
      const duration = course
        ? `${course.duration} Hours`
        : `${internship.duration} Weeks`;

      // Create cert record first (gets auto-ID)
      const cert = new Certificate({
        student: student._id,
        type,
        course: course?._id,
        internship: internship?._id,
        enrollment: enrollment._id,
        title: 'Certificate of Completion',
        courseName: course?.title,
        internshipName: internship?.title,
        instructorName: instructor?.fullName || instructor?.firstName + ' ' + instructor?.lastName || 'Code Crafters Team',
        duration,
        issueDate: new Date(),
      });

      const verificationUrl = `${process.env.CERT_VERIFY_URL}/${cert.certificateId}`;
      cert.verificationUrl = verificationUrl;

      // Generate QR
      const qrData = await QRCode.toDataURL(verificationUrl);
      cert.qrCode = qrData;

      // Generate PDF
      const pdfBuffer = await generateCertificatePDF({
        certificateId: cert.certificateId,
        studentName: `${student.firstName} ${student.lastName}`,
        courseName: course?.title,
        internshipName: internship?.title,
        instructorName: cert.instructorName,
        duration,
        issueDate: cert.issueDate,
      });

      // Upload to Cloudinary
      const uploaded = await uploadCertificatePDF(pdfBuffer, cert.certificateId);
      cert.pdfUrl = uploaded.secure_url;
      cert.pdfPublicId = uploaded.public_id;

      await cert.save();

      // Send email notification
      await emailService.sendCertificate(student.email, student.firstName, {
        certificateId: cert.certificateId,
        courseName: itemName,
      }).catch((err) => logger.error('Certificate email failed:', err));

      logger.info(`Certificate generated: ${cert.certificateId} for ${student.email}`);
      return cert;
    } catch (error) {
      logger.error(`Certificate generation failed: ${error.message}`);
      throw error;
    }
  },

  verify: async (certificateId) => {
    const cert = await Certificate.findOne({ certificateId })
      .populate('student', 'firstName lastName email')
      .populate('course', 'title')
      .populate('internship', 'title');

    if (!cert) return null;

    return {
      isValid: cert.status === 'active',
      status: cert.status,
      certificateId: cert.certificateId,
      studentName: `${cert.student?.firstName} ${cert.student?.lastName}`,
      courseName: cert.courseName || cert.course?.title,
      internshipName: cert.internshipName || cert.internship?.title,
      issueDate: cert.issueDate,
      duration: cert.duration,
      type: cert.type,
    };
  },
};

module.exports = { certificateService, generateCertificatePDF };

const axios = require('axios');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { certificateService } = require('../services/certificateService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get my certificates
// @route   GET /api/certificates/my
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title thumbnail')
      .populate('internship', 'title thumbnail')
      .sort('-issueDate');
    return ApiResponse.success(res, certificates);
  } catch (error) { next(error); }
};

// @desc    Verify certificate (Public)
// @route   GET /api/certificates/verify/:certificateId
exports.verifyCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.verify(req.params.certificateId);
    if (!result) return ApiResponse.notFound(res, 'Certificate not found');
    return ApiResponse.success(res, result, result.isValid ? 'Certificate is valid' : 'Certificate has been revoked or is invalid');
  } catch (error) { next(error); }
};

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
exports.downloadCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return ApiResponse.notFound(res, 'Certificate not found');

    // Only owner or admin can download
    if (cert.student.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
      return ApiResponse.forbidden(res);
    }

    if (cert.status === 'revoked') return ApiResponse.error(res, 'This certificate has been revoked', 400);
    if (!cert.pdfUrl) return ApiResponse.error(res, 'Certificate PDF not available', 404);

    cert.downloadCount += 1;
    await cert.save({ validateBeforeSave: false });

    const filename = `${cert.certificateId}.pdf`;
    let downloadSource = cert.pdfUrl;

    try {
      if (cert.pdfPublicId) {
        // ensure resource exists
        await cloudinary.api.resource(cert.pdfPublicId, { resource_type: 'raw' });
        // Use private_download_url which generates signed API download URL including timestamp & signature
        downloadSource = cloudinary.utils.private_download_url(cert.pdfPublicId, 'pdf', {
          resource_type: 'raw',
          type: 'upload',
          attachment: filename,
        });
      }
    } catch (resourceError) {
      console.warn('Cloudinary signed download generation failed, using stored URL:', resourceError.message);
      downloadSource = cert.pdfUrl;
    }

    // Redirect client to signed Cloudinary download URL (time-limited). This avoids proxying binary data
    // and prevents signature/redirect issues when streaming from Cloudinary via server-side axios.
    return res.redirect(downloadSource);
  } catch (error) { next(error); }
};

// @desc    Manually trigger certificate generation (Admin)
// @route   POST /api/certificates/generate
exports.generateCertificate = async (req, res, next) => {
  try {
    const { enrollmentId } = req.body;
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student')
      .populate('course')
      .populate('internship');

    if (!enrollment) return ApiResponse.notFound(res, 'Enrollment not found');
    if (enrollment.certificateIssued) return ApiResponse.error(res, 'Certificate already issued', 409);

    let instructor = null;
    if (enrollment.course) {
      const course = await Course.findById(enrollment.course._id).populate('instructor', 'firstName lastName');
      instructor = course?.instructor;
    }

    const cert = await certificateService.generate({
      student: enrollment.student,
      type: enrollment.type,
      course: enrollment.course,
      internship: enrollment.internship,
      enrollment,
      instructor,
    });

    enrollment.certificateIssued = true;
    enrollment.certificate = cert._id;
    await enrollment.save();

    return ApiResponse.created(res, cert, 'Certificate generated successfully');
  } catch (error) { next(error); }
};

// @desc    Revoke certificate (Admin)
// @route   PUT /api/certificates/:id/revoke
exports.revokeCertificate = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return ApiResponse.notFound(res, 'Certificate not found');
    if (cert.status === 'revoked') return ApiResponse.error(res, 'Certificate already revoked', 400);

    cert.status = 'revoked';
    cert.revokedAt = new Date();
    cert.revokedBy = req.user._id;
    cert.revokeReason = reason;
    await cert.save();

    return ApiResponse.success(res, null, 'Certificate revoked');
  } catch (error) { next(error); }
};

// @desc    Get all certificates (Admin)
// @route   GET /api/certificates
exports.getAllCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const total = await Certificate.countDocuments(query);
    const certs = await Certificate.find(query)
      .populate('student', 'firstName lastName email')
      .populate('course', 'title')
      .populate('internship', 'title')
      .sort('-issueDate')
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(res, certs, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

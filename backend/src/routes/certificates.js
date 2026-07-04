// certificates.js
const express = require('express');
const router = express.Router();
const certController = require('../controllers/certificateController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/my', authenticate, certController.getMyCertificates);
router.get('/verify/:certificateId', certController.verifyCertificate);
router.get('/', authenticate, isAdmin, certController.getAllCertificates);
router.get('/:id/download', authenticate, certController.downloadCertificate);
router.post('/generate', authenticate, isAdmin, certController.generateCertificate);
router.put('/:id/revoke', authenticate, isAdmin, certController.revokeCertificate);

module.exports = router;

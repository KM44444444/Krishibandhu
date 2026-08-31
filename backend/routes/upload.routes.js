const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/upload.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { uploadSoilReport, uploadProductImage } = require('../middleware/upload');

router.use(authenticate);

// Government attaches a scanned/lab report file (PDF or image) to a soil report
router.post('/soil-report', authorize('government'), uploadSoilReport.single('file'), ctrl.uploadSoilReportFile);

// Seller attaches a product image
router.post('/product-image', authorize('seller'), uploadProductImage.single('file'), ctrl.uploadProductImageFile);

module.exports = router;

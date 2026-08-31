// Files are saved by multer already; we just return the public URL.

exports.uploadSoilReportFile = (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const url = `/uploads/soil-reports/${req.file.filename}`;
    res.status(201).json({ success: true, message: 'File uploaded.', url, filename: req.file.originalname });
};

exports.uploadProductImageFile = (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const url = `/uploads/product-images/${req.file.filename}`;
    res.status(201).json({ success: true, message: 'File uploaded.', url, filename: req.file.originalname });
};

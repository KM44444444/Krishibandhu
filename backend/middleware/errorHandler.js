function errorHandler(err, req, res, next) {
    console.error('[ERROR]', err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);

    // Multer errors (file too large, wrong type, etc.) — return 400, not 500
    if (err.name === 'MulterError' || /files are allowed/i.test(err.message || '')) {
        return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error.'
    });
}

module.exports = errorHandler;

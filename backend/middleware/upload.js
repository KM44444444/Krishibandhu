const multer = require('multer');
const path = require('path');
const fs = require('fs');

function makeUploader(subfolder, allowedTypes, friendlyLabel) {
    const dir = path.join(__dirname, '..', 'uploads', subfolder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, dir),
        filename: (req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        }
    });

    return multer({
        storage,
        limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
        fileFilter: (req, file, cb) => {
            if (!allowedTypes.test(file.mimetype)) {
                return cb(new Error(`Only ${friendlyLabel} files are allowed.`));
            }
            cb(null, true);
        }
    });
}

const uploadSoilReport = makeUploader('soil-reports', /pdf|image\/(png|jpe?g)/, 'PDF or image (PNG/JPG)');
const uploadProductImage = makeUploader('product-images', /image\/(png|jpe?g|webp)/, 'image (PNG/JPG/WEBP)');

module.exports = { uploadSoilReport, uploadProductImage };

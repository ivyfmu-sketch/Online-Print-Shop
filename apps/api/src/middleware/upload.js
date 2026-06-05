const multer = require('multer');
const path = require('path');
const { env } = require('../config/env');
const allowed = new Map([['application/pdf','.pdf'],['image/jpeg','.jpg'],['image/png','.png']]);
const upload = multer({
  dest: path.resolve(__dirname, '../../storage/tmp'),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!allowed.has(file.mimetype)) return cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    cb(null, true);
  }
});
module.exports = { upload };

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/printshop',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  storageDir: path.resolve(__dirname, '../../', process.env.STORAGE_DIR || './storage/encrypted'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25),
  fileEncryptionKey: process.env.FILE_ENCRYPTION_KEY || '',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@printshop.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  printerCommand: process.env.PRINTER_COMMAND || 'lp',
  defaultPrinter: process.env.DEFAULT_PRINTER || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  clamavHost: process.env.CLAMAV_HOST || '127.0.0.1',
  clamavPort: Number(process.env.CLAMAV_PORT || 3310)
};
module.exports = { env };

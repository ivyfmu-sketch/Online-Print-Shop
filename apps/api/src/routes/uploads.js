const express = require('express');
const fs = require('fs/promises');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { extractMetadata, encryptUpload } = require('../services/fileService');
const { scanFile } = require('../services/virusScanService');
const { audit } = require('../services/auditService');
const { getPricing } = require('../services/pricingService');
const router = express.Router();
router.post('/', requireAuth, upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Document is required' });
  const pricing = await getPricing();
  if (req.file.size > pricing.maxUploadMb * 1024 * 1024) { await fs.rm(req.file.path, { force: true }); return res.status(413).json({ error: `File exceeds configured ${pricing.maxUploadMb}MB limit` }); }
  const scan = await scanFile(req.file.path);
  if (!scan.clean) { await fs.rm(req.file.path, { force: true }); return res.status(422).json({ error: 'Virus scan failed' }); }
  const meta = await extractMetadata(req.file);
  const encrypted = await encryptUpload(req.file);
  const { rows } = await query(`insert into documents (user_id, original_name, mime_type, file_size, page_count, storage_path, encryption_iv, auth_tag)
    values ($1,$2,$3,$4,$5,$6,$7,$8) returning id,original_name,mime_type,file_size,page_count,created_at`, [req.user.id, req.file.originalname, req.file.mimetype, req.file.size, meta.pages, encrypted.storagePath, encrypted.iv, encrypted.authTag]);
  await audit(req.user.id, 'document.uploaded', { documentId: rows[0].id, pages: meta.pages, scan });
  res.status(201).json({ document: rows[0] });
}));
module.exports = router;

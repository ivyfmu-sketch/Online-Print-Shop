const crypto = require('crypto');
const fs = require('fs/promises');
const fss = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const { v4: uuid } = require('uuid');
const { env } = require('../config/env');

function key() {
  if (env.fileEncryptionKey) return crypto.createHash('sha256').update(env.fileEncryptionKey).digest();
  return crypto.createHash('sha256').update(env.jwtSecret).digest();
}
async function ensureStorage() { await fs.mkdir(env.storageDir, { recursive: true }); }
async function extractMetadata(file) {
  if (file.mimetype === 'application/pdf') {
    const data = await fs.readFile(file.path);
    const parsed = await pdfParse(data);
    return { pages: parsed.numpages || 1 };
  }
  const meta = await sharp(file.path).metadata();
  return { pages: 1, width: meta.width, height: meta.height };
}
async function encryptUpload(file) {
  await ensureStorage();
  const iv = crypto.randomBytes(16);
  const id = uuid();
  const encryptedName = `${id}.enc`;
  const target = path.join(env.storageDir, encryptedName);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const input = fss.createReadStream(file.path);
  const output = fss.createWriteStream(target);
  await new Promise((resolve, reject) => input.pipe(cipher).pipe(output).on('finish', resolve).on('error', reject));
  const tag = cipher.getAuthTag();
  await fs.rm(file.path, { force: true });
  return { storagePath: target, iv: iv.toString('base64'), authTag: tag.toString('base64') };
}
async function decryptToTemp(document) {
  const tempPath = path.resolve(__dirname, '../../storage/tmp', `${document.id}-${document.original_name}`);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(document.encryption_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(document.auth_tag, 'base64'));
  await new Promise((resolve, reject) => fss.createReadStream(document.storage_path).pipe(decipher).pipe(fss.createWriteStream(tempPath)).on('finish', resolve).on('error', reject));
  return tempPath;
}
async function secureDelete(storagePath) { await fs.rm(storagePath, { force: true }); }
module.exports = { extractMetadata, encryptUpload, decryptToTemp, secureDelete };

const { spawn } = require('child_process');
const fs = require('fs/promises');
const { env } = require('../config/env');
const { query } = require('../db/pool');
const { decryptToTemp, secureDelete } = require('./fileService');

function buildArgs(filePath, settings, printerName) {
  const args = [];
  if (env.printerCommand === 'lp') {
    if (printerName) args.push('-d', printerName);
    args.push('-n', String(settings.copies));
    args.push('-o', `orientation-requested=${settings.orientation === 'landscape' ? 4 : 3}`);
    args.push('-o', `media=${settings.paper_size}`);
    if (settings.page_range && settings.page_range !== 'all') args.push('-P', settings.page_range);
    args.push(filePath);
  } else {
    args.push(filePath);
  }
  return args;
}
async function sendPrintJob(orderId) {
  const { rows } = await query(`select o.*, d.original_name,d.storage_path,d.encryption_iv,d.auth_tag,d.id as doc_id from orders o join documents d on d.id=o.document_id where o.id=$1`, [orderId]);
  if (!rows.length) throw new Error('Order not found');
  const order = rows[0];
  await query("update orders set status='printing', print_status='printing' where id=$1", [orderId]);
  const temp = await decryptToTemp(order);
  const printer = order.printer_name || env.defaultPrinter;
  await new Promise((resolve, reject) => {
    const child = spawn(env.printerCommand, buildArgs(temp, order, printer), { stdio: 'ignore' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Printer command failed with code ${code}`)));
    child.on('error', reject);
  });
  await fs.rm(temp, { force: true });
  await query("update orders set status='completed', print_status='completed', completed_at=now() where id=$1", [orderId]);
  await secureDelete(order.storage_path);
}
async function listPrinters() {
  if (env.printerCommand !== 'lpstat') return [{ name: env.defaultPrinter || 'System default printer', status: 'unknown' }];
  return [];
}
module.exports = { sendPrintJob, listPrinters };

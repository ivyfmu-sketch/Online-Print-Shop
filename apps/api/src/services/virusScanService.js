const NodeClam = require('clamdjs');
const { env } = require('../config/env');
async function scanFile(filePath) {
  if (env.nodeEnv === 'development' && process.env.SKIP_VIRUS_SCAN !== 'false') return { clean: true, skipped: true };
  const scanner = NodeClam.createScanner(env.clamavHost, env.clamavPort);
  const result = await scanner.scanFile(filePath);
  return { clean: result.indexOf('FOUND') === -1, raw: result };
}
module.exports = { scanFile };

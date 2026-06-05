const { AppError } = require('../utils/errors');
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
  return res.status(500).json({ error: 'Internal server error' });
}
module.exports = { errorHandler };

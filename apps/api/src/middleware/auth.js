const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { query } = require('../db/pool');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await query('select id,email,name,role,email_verified from users where id=$1', [payload.sub]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid token' });
    req.user = rows[0];
    next();
  } catch (error) { res.status(401).json({ error: 'Invalid or expired token' }); }
}
function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Insufficient permissions' });
}
module.exports = { requireAuth, requireRole };

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { query } = require('../db/pool');
const { env } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../services/auditService');
const router = express.Router();
const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
function token(user) { return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn }); }
router.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const { rows } = await query('insert into users (name,email,password_hash,role) values ($1,$2,$3,$4) returning id,name,email,role', [input.name, input.email.toLowerCase(), passwordHash, 'user']);
  await audit(rows[0].id, 'user.registered');
  res.status(201).json({ user: rows[0], token: token(rows[0]) });
}));
router.post('/login', asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { rows } = await query('select id,name,email,role,password_hash from users where email=$1', [input.email.toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
  await audit(user.id, 'user.login');
  delete user.password_hash;
  res.json({ user, token: token(user) });
}));
router.post('/forgot-password', asyncHandler(async (req, res) => {
  res.json({ message: 'If the account exists, a reset email will be sent by the configured mail provider.' });
}));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
module.exports = router;

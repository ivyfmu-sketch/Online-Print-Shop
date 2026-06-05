const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { env } = require('./config/env');
const { query } = require('./db/pool');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middleware/errorHandler');

async function seedAdmin() {
  const hash = await bcrypt.hash(env.adminPassword, 12);
  await query(`insert into users (name,email,password_hash,role,email_verified) values ('Administrator',$1,$2,'admin',true)
    on conflict (email) do nothing`, [env.adminEmail, hash]);
}
async function seedSettings() {
  const defaults = { mono_price_per_page: '2', color_price_per_page: '5', max_upload_mb: String(env.maxUploadMb), delete_after_hours: '24', upi_id: 'merchant@upi', merchant_name: 'Online Print Shop' };
  for (const [key, value] of Object.entries(defaults)) await query('insert into settings (key,value) values ($1,$2) on conflict (key) do nothing', [key, value]);
}
async function bootstrap() {
  await seedAdmin();
  await seedSettings();
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
  app.use('/api/payments', paymentRoutes);
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  app.listen(env.port, () => console.log(`API listening on ${env.port}`));
}
if (require.main === module) bootstrap().catch(error => { console.error(error); process.exit(1); });
module.exports = { bootstrap };

const express = require('express');
const { z } = require('zod');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { listPrinters, sendPrintJob } = require('../services/printService');
const { audit } = require('../services/auditService');
const router = express.Router();
router.use(requireAuth, requireRole('admin'));
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { rows } = await query(`select count(*)::int orders, coalesce(sum(amount),0)::numeric revenue, count(*) filter (where status='completed')::int completed from orders`);
  res.json({ metrics: rows[0] });
}));
router.get('/orders', asyncHandler(async (req, res) => {
  const { rows } = await query(`select o.id,d.original_name,d.file_size,d.page_count,u.name user_name,o.print_type,o.copies,o.amount,o.status,o.payment_status,o.print_status,o.created_at from orders o join documents d on d.id=o.document_id join users u on u.id=o.user_id order by o.created_at desc`);
  res.json({ orders: rows });
}));
router.post('/orders/:id/reprint', asyncHandler(async (req, res) => { await audit(req.user.id, 'order.reprint', { orderId: req.params.id }); sendPrintJob(req.params.id).catch(console.error); res.json({ queued: true }); }));
router.post('/orders/:id/cancel', asyncHandler(async (req, res) => { await query("update orders set status='cancelled', print_status='cancelled' where id=$1", [req.params.id]); res.json({ cancelled: true }); }));
router.get('/transactions', asyncHandler(async (req, res) => {
  const { rows } = await query('select id,amount,payment_status,transaction_id,created_at from orders order by created_at desc');
  res.json({ transactions: rows });
}));
router.get('/settings', asyncHandler(async (req, res) => {
  const { rows } = await query('select key,value,is_secret from settings order by key');
  res.json({ settings: rows.map(r => ({ ...r, value: r.is_secret ? '********' : r.value })) });
}));
router.put('/settings', asyncHandler(async (req, res) => {
  const body = z.record(z.string()).parse(req.body);
  for (const [key, value] of Object.entries(body)) await query('insert into settings (key,value) values ($1,$2) on conflict (key) do update set value=excluded.value, updated_at=now()', [key, value]);
  await audit(req.user.id, 'settings.updated', { keys: Object.keys(body) });
  res.json({ saved: true });
}));
router.get('/printers', asyncHandler(async (req, res) => res.json({ printers: await listPrinters() })));
router.post('/printers/test', asyncHandler(async (req, res) => res.json({ queued: true, message: 'Send a small PDF test order or configure OS-level printer test page.' })));
module.exports = router;

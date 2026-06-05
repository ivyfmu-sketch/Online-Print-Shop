const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { createUpiQr, verifyRazorpaySignature } = require('../services/paymentService');
const { sendPrintJob } = require('../services/printService');
const { env } = require('../config/env');
const { audit } = require('../services/auditService');
const router = express.Router();
router.get('/:orderId/qr', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('select * from orders where id=$1 and user_id=$2', [req.params.orderId, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  res.json(await createUpiQr(rows[0]));
}));
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const payload = req.body.toString('utf8');
  const signature = req.headers['x-razorpay-signature'];
  if (env.razorpayWebhookSecret && !verifyRazorpaySignature(payload, signature, env.razorpayWebhookSecret)) return res.status(400).json({ error: 'Invalid signature' });
  const event = JSON.parse(payload);
  const orderId = event.payload?.payment?.entity?.notes?.order_id;
  const transactionId = event.payload?.payment?.entity?.id;
  if (event.event === 'payment.captured' && orderId) {
    await query("update orders set payment_status='success',status='paid',transaction_id=$2,payment_gateway_response=$3 where id=$1", [orderId, transactionId, event]);
    sendPrintJob(orderId).catch(error => query("update orders set print_status='failed',status='failed',payment_gateway_response=coalesce(payment_gateway_response,'{}'::jsonb)||$2 where id=$1", [orderId, { printError: error.message }]));
  }
  res.json({ received: true });
}));
router.post('/:orderId/mock-success', requireAuth, asyncHandler(async (req, res) => {
  if (env.nodeEnv === 'production') return res.status(403).json({ error: 'Mock payments are disabled in production' });
  const { rows } = await query("update orders set payment_status='success',status='paid',transaction_id=$3 where id=$1 and user_id=$2 returning id", [req.params.orderId, req.user.id, `mock_${Date.now()}`]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  await audit(req.user.id, 'payment.mock_success', { orderId: req.params.orderId });
  sendPrintJob(req.params.orderId).catch(console.error);
  res.json({ status: 'success' });
}));
module.exports = router;

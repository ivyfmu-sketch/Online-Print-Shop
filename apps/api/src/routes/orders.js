const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { getPricing, calculate } = require('../services/pricingService');
const { createUpiQr } = require('../services/paymentService');
const { audit } = require('../services/auditService');
const router = express.Router();
const schema = z.object({ documentId: z.string().uuid(), printType: z.enum(['mono','color']), copies: z.number().int().min(1).max(100), orientation: z.enum(['portrait','landscape']), paperSize: z.enum(['A4','A3']), pageRange: z.string().default('all') });
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(`select o.id,d.original_name,o.print_type,o.copies,o.amount,o.status,o.payment_status,o.print_status,o.created_at from orders o join documents d on d.id=o.document_id where o.user_id=$1 order by o.created_at desc`, [req.user.id]);
  res.json({ orders: rows });
}));
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const input = schema.parse(req.body);
  const { rows: docs } = await query('select * from documents where id=$1 and user_id=$2', [input.documentId, req.user.id]);
  if (!docs.length) return res.status(404).json({ error: 'Document not found' });
  const pricing = await getPricing();
  const totals = calculate({ printType: input.printType, pages: docs[0].page_count, copies: input.copies, pricing });
  const { rows } = await query(`insert into orders (user_id,document_id,print_type,copies,orientation,paper_size,page_range,price_per_page,amount,status,payment_status,print_status)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'payment_pending','pending','queued') returning *`, [req.user.id, input.documentId, input.printType, input.copies, input.orientation, input.paperSize, input.pageRange, totals.pricePerPage, totals.amount]);
  const qr = await createUpiQr(rows[0]);
  await audit(req.user.id, 'order.created', { orderId: rows[0].id });
  res.status(201).json({ order: rows[0], document: docs[0], qr });
}));
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(`select o.*,d.original_name,d.file_size,d.page_count from orders o join documents d on d.id=o.document_id where o.id=$1 and o.user_id=$2`, [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: rows[0] });
}));
module.exports = router;

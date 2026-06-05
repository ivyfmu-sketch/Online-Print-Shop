const crypto = require('crypto');
const QRCode = require('qrcode');
const { query } = require('../db/pool');
async function getPaymentSettings() {
  const { rows } = await query("select key,value from settings where key in ('upi_id','merchant_name','razorpay_key_id','phonepe_merchant_id','paytm_mid')");
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
function upiUri({ upiId, merchantName, amount, orderId }) {
  const params = new URLSearchParams({ pa: upiId, pn: merchantName || 'Online Print Shop', am: String(amount), cu: 'INR', tn: `Print order ${orderId}` });
  return `upi://pay?${params}`;
}
async function createUpiQr(order) {
  const settings = await getPaymentSettings();
  const uri = upiUri({ upiId: settings.upi_id || 'merchant@upi', merchantName: settings.merchant_name, amount: order.amount, orderId: order.id });
  return { uri, qrDataUrl: await QRCode.toDataURL(uri) };
}
function verifyRazorpaySignature(payload, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}
module.exports = { createUpiQr, verifyRazorpaySignature };

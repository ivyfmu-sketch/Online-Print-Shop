const { query } = require('../db/pool');
async function getPricing() {
  const { rows } = await query("select key,value from settings where key in ('mono_price_per_page','color_price_per_page','max_upload_mb','delete_after_hours')");
  const settings = Object.fromEntries(rows.map(r => [r.key, Number(r.value)]));
  return { mono: settings.mono_price_per_page || 2, color: settings.color_price_per_page || 5, maxUploadMb: settings.max_upload_mb || 25, deleteAfterHours: settings.delete_after_hours || 24 };
}
function calculate({ printType, pages, copies, pricing }) {
  const pricePerPage = printType === 'color' ? pricing.color : pricing.mono;
  return { pricePerPage, amount: pricePerPage * pages * copies };
}
module.exports = { getPricing, calculate };

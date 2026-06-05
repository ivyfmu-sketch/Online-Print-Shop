const { query } = require('../db/pool');
async function audit(actorId, action, metadata = {}) {
  await query('insert into audit_logs (actor_id, action, metadata) values ($1,$2,$3)', [actorId || null, action, metadata]);
}
module.exports = { audit };

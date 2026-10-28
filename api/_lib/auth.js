const crypto = require('crypto');
const secret = () => process.env.INVOICE_SESSION_SECRET || '';
const configured = () => !!process.env.INVOICE_PASSWORD && secret().length >= 24;
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
function makeToken() { const exp = String(Date.now() + 7 * 86400000); return exp + '.' + sign(exp); }
function getCookie(req, name) { const m = String(req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '=')); return m ? m.slice(name.length + 1) : ''; }
function isAuthed(req) {
  if (!configured()) return false;
  const t = getCookie(req, 'iv_session'); const i = t.indexOf('.'); if (i < 1) return false;
  const exp = t.slice(0, i), sig = t.slice(i + 1), good = sign(exp);
  const a = Buffer.from(sig), b = Buffer.from(good);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && Number(exp) > Date.now();
}
function requireAuth(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(500).json({ error: 'not_configured' }); return false; }
  if (!isAuthed(req)) { res.status(401).json({ error: 'unauthorized' }); return false; }
  return true;
}
function passwordOk(input) {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(input), h(process.env.INVOICE_PASSWORD || ''));
}
const cookie = (v, maxAge) => `iv_session=${v}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
const body = (req) => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = null; } } return b && typeof b === 'object' ? b : {}; };
module.exports = { configured, makeToken, isAuthed, requireAuth, passwordOk, cookie, body };

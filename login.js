const { configured, makeToken, passwordOk, cookie, body } = require('./_lib/auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!configured()) return res.status(500).json({ error: 'not_configured' });
  const pw = String(body(req).password || '');
  if (!pw || pw.length > 200 || !passwordOk(pw)) { await new Promise((r) => setTimeout(r, 800)); return res.status(401).json({ error: 'wrong_password' }); }
  res.setHeader('Set-Cookie', cookie(makeToken(), 7 * 86400));
  return res.status(200).json({ ok: true });
};

const { configured, isAuthed } = require('./_lib/auth');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) return res.status(500).json({ error: 'not_configured' });
  return isAuthed(req) ? res.status(200).json({ ok: true }) : res.status(401).json({ error: 'unauthorized' });
};

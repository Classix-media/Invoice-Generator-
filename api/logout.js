const { cookie } = require('./_lib/auth');
module.exports = (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Set-Cookie', cookie('', 0)); res.status(200).json({ ok: true }); };

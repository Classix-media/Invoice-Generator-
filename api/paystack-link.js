/* Creates a Paystack payment link for one invoice with Paystack's official "Initialize Transaction" API.
   Amount/currency are set here from the invoice; the secret key never leaves the server. Does NOT mark anything paid. */
const { requireAuth, body } = require('./_lib/auth');
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!requireAuth(req, res)) return;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'paystack_not_configured' });
  const b = body(req), invoiceNo = String(b.invoiceNo || ''), currency = String(b.currency || '').toUpperCase(), email = String(b.email || '').trim().toLowerCase();
  const amount = Number(b.amount);
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(invoiceNo)) return res.status(400).json({ error: 'invalid_invoice_number' });
  if (!['NGN', 'USD'].includes(currency)) return res.status(400).json({ error: 'invalid_currency' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'client_email_required' });
  const minor = Math.round(amount * 100);
  if (!Number.isFinite(amount) || minor < 100 || minor > 1e10) return res.status(400).json({ error: 'invalid_amount' });
  const reference = ('INV-' + invoiceNo + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 100);
  try {
    const r = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount: minor, currency, reference, metadata: { invoice_no: invoiceNo, source: 'implify-invoice-generator', client_name: String(b.clientName || '').slice(0, 120) } }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.status || !j.data || !j.data.authorization_url) return res.status(502).json({ error: 'paystack_refused', message: String((j && j.message) || '').slice(0, 200) });
    return res.status(200).json({ url: j.data.authorization_url, reference: j.data.reference || reference, amount: minor / 100, currency });
  } catch (e) { return res.status(502).json({ error: 'paystack_unreachable' }); }
};

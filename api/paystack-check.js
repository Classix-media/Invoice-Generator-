/* Independent payment confirmation. An invoice is only reported paid when Paystack says the transaction succeeded
   for the exact amount, currency and invoice number. */
const { requireAuth, body } = require('./_lib/auth');
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!requireAuth(req, res)) return;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'paystack_not_configured' });
  const b = body(req), reference = String(b.reference || ''), currency = String(b.currency || '').toUpperCase(), invoiceNo = String(b.invoiceNo || '');
  const minor = Math.round(Number(b.amount) * 100);
  if (!/^[A-Za-z0-9_.=-]{6,100}$/.test(reference) || !Number.isFinite(minor) || minor < 100) return res.status(400).json({ error: 'invalid_request' });
  try {
    const r = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), { headers: { Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(12000) });
    const j = await r.json().catch(() => ({})), d = j && j.data;
    if (!r.ok || !j.status || !d) return res.status(200).json({ paid: false, reason: 'not_found' });
    if (String(d.status).toLowerCase() !== 'success') return res.status(200).json({ paid: false, reason: String(d.status || 'pending') });
    if (String(d.currency).toUpperCase() !== currency) return res.status(200).json({ paid: false, reason: 'currency_mismatch' });
    if (Number(d.amount) !== minor) return res.status(200).json({ paid: false, reason: 'amount_mismatch' });
    if (!d.metadata || String(d.metadata.invoice_no || '') !== invoiceNo) return res.status(200).json({ paid: false, reason: 'invoice_mismatch' });
    return res.status(200).json({ paid: true, paid_at: d.paid_at || null, channel: d.channel || null, reference: d.reference });
  } catch (e) { return res.status(502).json({ error: 'paystack_unreachable' }); }
};

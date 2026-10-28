/* Invoice maths in whole minor units (kobo / cents) so totals never drift from floating-point errors. */
(function (root) {
  const num = (v, max) => { let n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); if (!Number.isFinite(n) || n < 0) n = 0; return max != null ? Math.min(n, max) : n; };
  const toMinor = (v) => Math.round(num(v) * 100);
  function compute(inv) {
    const warnings = [];
    const lines = (inv.items || []).map((it, i) => {
      const q = num(it.qty), p = toMinor(it.price);
      if (String(it.qty).trim() !== '' && !(parseFloat(String(it.qty).replace(/,/g, '')) >= 0)) warnings.push(`Item ${i + 1}: quantity must be a positive number.`);
      if (String(it.price).trim() !== '' && !(parseFloat(String(it.price).replace(/,/g, '')) >= 0)) warnings.push(`Item ${i + 1}: price must be a positive number.`);
      return Math.round(q * p);
    });
    const subtotal = lines.reduce((a, b) => a + b, 0);
    const dv = inv.discountValue;
    let discount = inv.discountType === 'percent' ? Math.round(subtotal * num(dv, 100) / 100) : Math.min(toMinor(dv), subtotal);
    if (inv.discountType !== 'percent' && toMinor(dv) > subtotal && subtotal > 0) warnings.push('Discount is larger than the subtotal, so it was capped.');
    if (inv.discountType === 'percent' && num(dv) > 100) warnings.push('Percentage discount cannot exceed 100%, so it was capped.');
    const taxable = subtotal - discount, tax = Math.round(taxable * num(inv.taxPct, 100) / 100);
    return { lines, subtotal, discount, tax, total: taxable + tax, warnings };
  }
  const fmt = (minor, cur) => { const v = minor / 100; try { return new Intl.NumberFormat(cur === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency: cur }).format(v); } catch (_) { return (cur === 'NGN' ? '₦' : '$') + v.toFixed(2); } };
  const fmtPdf = (minor, cur) => (cur === 'NGN' ? 'NGN ' : '$') + (minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateText = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]} ${MON[+m[2] - 1] || ''} ${m[1]}` : ''; };
  root.IVCalc = { compute, fmt, fmtPdf, dateText, num, toMinor };
  if (typeof module !== 'undefined') module.exports = root.IVCalc;
})(typeof window !== 'undefined' ? window : globalThis);

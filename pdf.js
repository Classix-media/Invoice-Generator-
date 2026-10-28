/* Implify Visuals invoice PDF writer: real text-based PDF (standard Helvetica fonts, vector shapes, embedded JPEG logo).
   Design mirrors the Implify Visuals checkout invoice. Units below are "u" = 1% of page width. */
(function (root) {
  const WH = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 278, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 278, 611, 278, 278, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 278, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500], WB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 278, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 278, 611, 278, 278, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 278, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];
  const PW = 595.28, PH = 841.89, U = PW / 100, PAGE_H = PH / U;
  const CP = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E,
    0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
  function codes(s) { const o = []; for (const ch of String(s)) { let c = ch.codePointAt(0); if (c === 0x20A6) { o.push(78); continue; } if (c === 10 || c === 9) c = 32; if (CP[c]) c = CP[c]; else if (c < 32 || c > 255) c = 63; o.push(c); } return o; }
  function wid(s, bold, sizePt) { const t = bold ? WB : WH; let w = 0; for (const c of codes(s)) w += (c >= 32 ? t[c - 32] : 278) || 278; return w * sizePt / 1000; }
  const widU = (s, bold, sz) => wid(s, bold, sz * U) / U;
  function esc(s) { let o = ''; for (const c of codes(s)) { if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c); else if (c < 32 || c > 126) o += '\\' + c.toString(8).padStart(3, '0'); else o += String.fromCharCode(c); } return o; }
  const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => (parseInt(h.substr(i, 2), 16) / 255).toFixed(3)).join(' '); };
  const f2 = (n) => (+n).toFixed(2);

  function wrap(s, bold, sz, maxW) {
    const out = [];
    String(s == null ? '' : s).split(/\r?\n/).forEach((para) => {
      let line = '';
      const push = () => { if (line) out.push(line); line = ''; };
      para.split(/\s+/).filter(Boolean).forEach((tok) => {
        while (widU(tok, bold, sz) > maxW) { // very long token (URL): break by characters
          push(); let k = 1; while (k < tok.length && widU(tok.slice(0, k + 1), bold, sz) <= maxW) k++;
          out.push(tok.slice(0, k)); tok = tok.slice(k);
        }
        const t = line ? line + ' ' + tok : tok;
        if (widU(t, bold, sz) > maxW && line) { push(); line = tok; } else line = t;
      });
      push(); if (!para.trim()) out.push('');
    });
    return out;
  }

  class Doc {
    constructor(logo) { this.pages = []; this.logo = logo; this.cur = null; }
    page() { this.cur = { c: [], links: [] }; this.pages.push(this.cur); return this.cur; }
    rect(x, y, w, h, col) { this.cur.c.push(`${rgb(col)} rg ${f2(x * U)} ${f2(PH - (y + h) * U)} ${f2(w * U)} ${f2(h * U)} re f`); }
    rrect(x, y, w, h, r, col) {
      const X = x * U, Y = PH - (y + h) * U, Wd = w * U, H = h * U, R = Math.min(r * U, Wd / 2, H / 2), k = R * 0.5523;
      this.cur.c.push(`${rgb(col)} rg ${f2(X + R)} ${f2(Y)} m ${f2(X + Wd - R)} ${f2(Y)} l ${f2(X + Wd - R + k)} ${f2(Y)} ${f2(X + Wd)} ${f2(Y + R - k)} ${f2(X + Wd)} ${f2(Y + R)} c ${f2(X + Wd)} ${f2(Y + H - R)} l ${f2(X + Wd)} ${f2(Y + H - R + k)} ${f2(X + Wd - R + k)} ${f2(Y + H)} ${f2(X + Wd - R)} ${f2(Y + H)} c ${f2(X + R)} ${f2(Y + H)} l ${f2(X + R - k)} ${f2(Y + H)} ${f2(X)} ${f2(Y + H - R + k)} ${f2(X)} ${f2(Y + H - R)} c ${f2(X)} ${f2(Y + R)} l ${f2(X)} ${f2(Y + R - k)} ${f2(X + R - k)} ${f2(Y)} ${f2(X + R)} ${f2(Y)} c f`);
    }
    corner(col) { // blue top-right shape from the checkout invoice
      const P = (x, y) => `${f2(x * U)} ${f2(PH - y * U)}`, r = 9, k = r * 0.5523;
      this.cur.c.push(`${rgb(col)} rg ${P(34.7, 0)} m ${P(100, 0)} l ${P(100, 33.9)} l ${P(43.7, 33.9)} l ${P(43.7 - k, 33.9)} ${P(34.7, 33.9 - r + k)} ${P(34.7, 33.9 - r)} c ${P(34.7, 0)} l f`);
    }
    text(s, x, y, o = {}) { // y = vertical centre of the line
      let sz = o.size || 2, bold = !!o.bold; s = String(s == null ? '' : s);
      if (o.maxW) while (widU(s, bold, sz) > o.maxW && sz > 0.9) sz -= 0.05;
      const w = widU(s, bold, sz); let px = x; if (o.align === 'center') px = x - w / 2; else if (o.align === 'right') px = x - w;
      const font = o.italic ? 'F3' : bold ? 'F2' : 'F1';
      this.cur.c.push(`BT ${rgb(o.color || '#000000')} rg /${font} ${f2(sz * U)} Tf ${f2(px * U)} ${f2(PH - (y + sz * 0.36) * U)} Td (${esc(s)}) Tj ET`);
      return { w, x: px, size: sz };
    }
    line(x1, y1, x2, y2, wU, col) { this.cur.c.push(`${rgb(col)} RG ${f2(wU * U)} w ${f2(x1 * U)} ${f2(PH - y1 * U)} m ${f2(x2 * U)} ${f2(PH - y2 * U)} l S`); }
    image(x, y, w, h) { this.cur.c.push(`q ${f2(w * U)} 0 0 ${f2(h * U)} ${f2(x * U)} ${f2(PH - (y + h) * U)} cm /Im0 Do Q`); }
    link(x, y, w, h, uri) { this.cur.links.push({ x, y, w, h, uri }); }

    build(info) {
      const enc = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
      const parts = [], offs = []; let len = 0;
      const push = (d) => { const u8 = typeof d === 'string' ? enc(d) : d; parts.push(u8); len += u8.length; };
      const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); push(body); push('\nendobj\n'); };
      let n = 7; const pageObjs = [];
      this.pages.forEach((p) => { const o = { page: n++, content: n++, annots: p.links.map(() => n++) }; pageObjs.push(o); });
      push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      obj(1, '<</Type/Catalog/Pages 2 0 R>>');
      obj(2, `<</Type/Pages/Kids[${pageObjs.map((o) => o.page + ' 0 R').join(' ')}]/Count ${pageObjs.length}>>`);
      ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'].forEach((f, i) => obj(3 + i, `<</Type/Font/Subtype/Type1/BaseFont/${f}/Encoding/WinAnsiEncoding>>`));
      if (this.logo) { offs[6] = len; push(`6 0 obj\n<</Type/XObject/Subtype/Image/Width ${this.logo.w}/Height ${this.logo.h}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${this.logo.bytes.length}>>\nstream\n`); push(this.logo.bytes); push('\nendstream\nendobj\n'); }
      else obj(6, '<</Length 0>>\nstream\n\nendstream');
      const infoN = n++;
      this.pages.forEach((p, i) => {
        const o = pageObjs[i];
        obj(o.page, `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</Font<</F1 3 0 R/F2 4 0 R/F3 5 0 R>>/XObject<</Im0 6 0 R>>>>/Contents ${o.content} 0 R${o.annots.length ? '/Annots[' + o.annots.map((a) => a + ' 0 R').join(' ') + ']' : ''}>>`);
        const cs = p.c.join('\n'); obj(o.content, `<</Length ${cs.length}>>\nstream\n${cs}\nendstream`);
        p.links.forEach((l, k) => obj(o.annots[k], `<</Type/Annot/Subtype/Link/Rect[${f2(l.x * U)} ${f2(PH - (l.y + l.h) * U)} ${f2((l.x + l.w) * U)} ${f2(PH - l.y * U)}]/Border[0 0 0]/A<</S/URI/URI(${esc(l.uri)})>>>>`));
      });
      obj(infoN, `<</Title(${esc(info.title || '')})/Author(${esc(info.author || '')})/Producer(Implify Visuals Invoice)>>`);
      const total = n, xr = len; push(`xref\n0 ${total}\n0000000000 65535 f \n`);
      for (let i = 1; i < total; i++) push(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
      push(`trailer\n<</Size ${total}/Root 1 0 R/Info ${infoN} 0 R>>\nstartxref\n${xr}\n%%EOF`);
      return new Blob(parts, { type: 'application/pdf' });
    }
  }

  /* inv: normalised invoice. calc: totals in minor units. fmt(minor) -> string. biz: business settings. */
  function buildInvoicePdf(inv, calc, biz, fmt, logo) {
    const BL = '#005fff', d = new Doc(logo), paid = inv.status === 'paid';
    const bottom = 126;
    let pageNo = 0, y = 0;
    function newPage() {
      pageNo++; d.page(); d.rect(0, 0, 100, PAGE_H, BL); d.rect(5.4, 7.3, 89.2, 128.1, '#ffffff');
      if (pageNo === 1) {
        d.corner(BL);
        if (logo) d.image(13.55, 12, 13, 13);
        d.text(biz.name || 'Implify Visuals', 20.05, 28.3, { size: 2.2, align: 'center', maxW: 27 });
        let by = 31.6; [biz.phone, biz.email].filter(Boolean).forEach((t) => { d.text(t, 20.05, by, { size: 1.35, align: 'center', color: '#333333', maxW: 27 }); by += 2.3; });
        const pw = widU(inv.number, true, 3.4) + 6.4; d.rrect(38.7, 3.4, pw, 7.8, 2.2, '#ffffff'); d.text(inv.number, 38.7 + 3.2, 7.3, { size: 3.4, bold: true, color: '#111111', maxW: 40 });
        const dx = 38.7 + pw + 4;
        d.text('ISSUED:', dx, 5.8, { size: 1.9, bold: true, color: '#ffffff' }); d.text(inv.issueText, dx + 8.4, 5.8, { size: 1.9, color: '#ffffff' });
        d.text('DUE:', dx, 8.8, { size: 1.9, bold: true, color: '#ffffff' }); d.text(inv.dueText, dx + 8.4, 8.8, { size: 1.9, color: '#ffffff' });
        const title = paid ? 'PAID INVOICE' : 'INVOICE'; let ts = 17; while (widU(title, true, ts) > 57.8 && ts > 4) ts -= 0.2;
        d.text(title, 38.7, 22.4, { size: ts, bold: true, color: '#ffffff' });
        d.text('INVOICE TO:', 9, 39, { size: 2.4, bold: true });
        d.text(String(inv.client.name || 'CLIENT NAME').toUpperCase(), 9, 44.6, { size: 5.6, bold: true, maxW: 82 });
        y = 50; [inv.client.business, inv.client.email, inv.client.phone].filter(Boolean).forEach((t) => { d.text(t, 9, y, { size: 2, color: '#111111', maxW: 82 }); y += 2.8; });
        y = Math.max(y + 3, 56.6);
      } else {
        const t = `${inv.number} (continued) - page ${pageNo}`; const pw = widU(t, true, 2.4) + 6; d.rrect(5.4, 1.8, pw, 4.2, 1.6, '#ffffff'); d.text(t, 5.4 + 3, 3.9, { size: 2.4, bold: true, color: '#111111' });
        y = 13;
      }
    }
    const ensure = (h, lim) => { if (y + h > (lim || bottom)) { newPage(); header(); } };
    const tx = 8.9, tw = 82.2, cp = [0.34, 0.16, 0.10, 0.20, 0.20], cw = cp.map((p) => p * tw), heads = ['Description', 'Package', 'Qty', 'Price', 'Subtotal'];
    function header() {
      if (!inv.items.length) return;
      let cx = tx; heads.forEach((h, i) => { d.rect(cx, y, cw[i] - 0.4, 7.4, BL); d.text(h, i ? cx + cw[i] / 2 : cx + 1.6, y + 3.7, { size: 2.6, color: '#ffffff', align: i ? 'center' : 'left', maxW: cw[i] - 2 }); cx += cw[i]; });
      y += 7.4;
    }
    newPage(); header();
    inv.items.forEach((it) => {
      const dl = wrap(it.desc || '-', false, 2, cw[0] - 3), pl = wrap(it.pkg || '', false, 2, cw[1] - 2);
      const n = Math.max(dl.length, pl.length, 1), rh = Math.max(7, n * 2.8 + 3);
      ensure(rh + 1); let cx = tx;
      dl.forEach((t, k) => d.text(t, cx + 1.6, y + 3 + k * 2.8 + 0.5, { size: 2, color: '#111111' }));
      cx += cw[0]; pl.forEach((t, k) => d.text(t, cx + cw[1] / 2, y + 3 + k * 2.8 + 0.5, { size: 2, color: '#111111', align: 'center' })); cx += cw[1];
      const mid = y + rh / 2;
      d.text(String(it.qtyText), cx + cw[2] / 2, mid, { size: 2, color: '#111111', align: 'center', maxW: cw[2] - 1.5 }); cx += cw[2];
      d.text(it.priceText, cx + cw[3] / 2, mid, { size: 2, color: '#111111', align: 'center', maxW: cw[3] - 1.5 }); cx += cw[3];
      d.text(it.lineText, cx + cw[4] / 2, mid, { size: 2, bold: true, color: '#111111', align: 'center', maxW: cw[4] - 1.5 });
      y += rh; d.line(tx, y, tx + tw - 0.4, y, 0.12, '#d9d9d9');
    });
    // project notes
    if (inv.notes && inv.notes.trim()) {
      y += 4; ensure(9); d.text('PROJECT NOTES', 9, y, { size: 1.7, bold: true, color: BL }); y += 3.4;
      wrap(inv.notes, false, 1.8, 82).forEach((t) => { ensure(2.8); d.text(t, 9, y, { size: 1.8, color: '#333333' }); y += 2.7; });
    }
    y += 3; ensure(4); d.rect(5.4, y, 89.2, 0.5, '#555555'); y += 4;
    // totals bands (full width, alternating like the checkout invoice)
    const bands = [['SUBTOTAL:', fmt(calc.subtotal)], ['DISCOUNT:', calc.discount > 0 ? '-' + fmt(calc.discount) : '-']];
    if (calc.tax > 0) bands.push([`TAX (${inv.taxPct}%):`, fmt(calc.tax)]);
    bands.push([paid ? 'TOTAL PAID:' : 'TOTAL DUE:', fmt(calc.total)]);
    if (y + bands.length * 7.1 > bottom) { newPage(); }
    bands.forEach((b, i) => {
      const blue = i % 2 === 0 || i === bands.length - 1; d.rect(0, y, 100, 7.1, blue ? BL : '#ffffff');
      d.text(b[0], 3.6, y + 3.55, { size: 2.7, bold: true, color: blue ? '#ffffff' : '#000000' });
      d.text(b[1], 95, y + 3.55, { size: 2.4, color: blue ? '#ffffff' : '#000000', align: 'right', maxW: 60 }); y += 7.1;
    });
    y += 5;
    // payment info
    const note = 'Payment is required before project work begins.' + (inv.status === 'cancelled' ? ' This invoice has been cancelled.' : '');
    const nl = wrap(note, false, 1.9, 60), ph = nl.length * 2.6 + 3; ensure(ph + 2);
    d.rrect(4, y, 66, ph, 2.6, '#767676'); nl.forEach((t, i) => d.text(t, 37, y + 1.5 + (i + 0.5) * 2.6, { size: 1.9, color: '#ffffff', align: 'center' })); y += ph + 4;
    const block = (title, lines, link) => {
      if (!lines.length) return; ensure(8); d.text(title, 9, y, { size: 1.7, bold: true, color: BL }); y += 3.4;
      lines.forEach((t) => { ensure(2.8); const r = d.text(t, 9, y, { size: 1.9, color: link ? BL : '#222222' }); if (link) d.link(r.x, y - 1.3, r.w, 2.8, link); y += 2.8; }); y += 2;
    };
    const pay = (biz.paymentDetails || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (paid) block('PAYMENT RECEIVED', ['Thank you. This invoice has been paid in full.'].concat(inv.paymentRef ? ['Reference: ' + inv.paymentRef] : []));
    else {
      if (inv.paymentLink) { const ll = wrap(inv.paymentLink, false, 1.9, 80); block('PAY ONLINE (Paystack secure link)', ll, inv.paymentLink); }
      block('PAYMENT DETAILS', pay);
    }
    if (biz.terms) block('NOTES', wrap(biz.terms, false, 1.8, 80));
    // signature on the last page
    d.line(72, 131.2, 92.5, 131.2, 0.35, '#111111'); d.text('Authorized Signed', 82.25, 133.1, { size: 1.5, italic: true, color: '#111111', align: 'center' });
    return d.build({ title: `Invoice ${inv.number} - ${inv.client.name || ''}`, author: biz.name || 'Implify Visuals' });
  }
  root.IVPdf = { buildInvoicePdf, wrap, widU };
  if (typeof module !== 'undefined') module.exports = root.IVPdf;
})(typeof window !== 'undefined' ? window : globalThis);

/* Implify Visuals invoice renderer: same design, fonts and measurements as the invoice on the main website
   (checkout/booking). ONE routine draws the live preview AND the PDF, so they are always identical.
   u = 1% of page width; A4 = 100 x 141.42 u. Always a single page (flowing content scales to fit). */
(function (root) {
  'use strict';
  const BL = '#005fff', PAGE = 141.42, SANS = '"Inter Tight","Helvetica Neue",Helvetica,Arial,sans-serif', IMP = 'Impact,Anton,"Haettenschweiler","Arial Narrow Bold",sans-serif';

  function draw(canvas, m, opt) {
    opt = opt || {};
    const W = Math.round((opt.width || 600) * (opt.dpr || 1)), H = Math.round(W * PAGE / 100);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), u = W / 100; let r = null;
    for (let k = 1; k >= 0.5; k -= 0.05) { r = paint(ctx, u, k, m, opt.logo); if (!r.overflow) break; }
    return r;
  }

  function paint(x, u, k, m, logo) {
    const links = [], font = (w, s, f) => { x.font = `${w} ${(s * u).toFixed(2)}px ${f || SANS}`; };
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height);
    const W = x.canvas.width, measure = (s, w, sz) => { font(w, sz); return x.measureText(s).width / u; };
    const txt = (s, px, py, o) => {
      o = o || {}; let size = o.s || 2; s = String(s == null ? '' : s); font(o.i ? 'italic ' + (o.w || 400) : (o.w || 400), size);
      if (o.max) while (x.measureText(s).width > o.max * u && size > 0.8) { size -= 0.1; font(o.i ? 'italic ' + (o.w || 400) : (o.w || 400), size); }
      x.fillStyle = o.c || '#000'; x.textAlign = o.a || 'left'; x.textBaseline = 'middle'; x.fillText(s, px * u, py * u);
      const w = x.measureText(s).width / u; return { w, x: o.a === 'center' ? px - w / 2 : o.a === 'right' ? px - w : px };
    };
    const rr = (px, py, w, h, r, fill) => { x.beginPath(); x.roundRect ? x.roundRect(px * u, py * u, w * u, h * u, Math.min(r, h / 2) * u) : x.rect(px * u, py * u, w * u, h * u); x.fillStyle = fill; x.fill(); };
    const rect = (px, py, w, h, fill) => { x.fillStyle = fill; x.fillRect(px * u, py * u, w * u, h * u); };
    const wrap = (s, w, sz, mw) => {
      const out = []; String(s == null ? '' : s).split(/\r?\n/).forEach((para) => {
        let l = ''; const push = () => { if (l) out.push(l); l = ''; };
        para.split(/\s+/).filter(Boolean).forEach((t) => {
          while (measure(t, w, sz) > mw) { push(); let i = 1; while (i < t.length && measure(t.slice(0, i + 1), w, sz) <= mw) i++; out.push(t.slice(0, i)); t = t.slice(i); }
          const c = l ? l + ' ' + t : t; if (measure(c, w, sz) > mw && l) { push(); l = t; } else l = c;
        }); push();
      }); return out;
    };

    /* frame (identical geometry to the website invoice) */
    rect(0, 0, 100, PAGE, BL); rect(5.4, 7.3, 89.2, 128, '#fff');
    x.beginPath(); x.moveTo(34.7 * u, 0); x.lineTo(W, 0); x.lineTo(W, 33.9 * u); x.lineTo(43.7 * u, 33.9 * u); x.arcTo(34.7 * u, 33.9 * u, 34.7 * u, 24.9 * u, 9 * u); x.lineTo(34.7 * u, 0); x.fillStyle = BL; x.fill();
    if (logo && logo.complete && logo.naturalWidth) x.drawImage(logo, 13.55 * u, 12 * u, 13 * u, 13 * u);
    txt(m.biz.name || 'Implify Visuals', 20.05, 28.3, { s: 2.2, w: 400, a: 'center', max: 27 });

    /* number pill + dates + title */
    const ref = String(m.number || ''); font(500, 3.8); let rw = x.measureText(ref).width / u + 6.4, rs = 3.8;
    if (rw > 32) { rs = 3.8 * (32 - 6.4) / (rw - 6.4); font(500, rs); rw = x.measureText(ref).width / u + 6.4; }
    rr(38.7, 3.4, rw, 7.8, 2.2, '#fff'); txt(ref, 38.7 + 3.2, 7.3, { s: rs, w: 500, c: '#111' });
    const dx = 38.7 + rw + 4;
    txt('ISSUED:', dx, 5.8, { s: 1.9, w: 600, c: '#fff' }); txt(m.issue, dx + 8.4, 5.8, { s: 1.9, c: '#fff' });
    txt('DUE:', dx, 8.8, { s: 1.9, w: 600, c: '#fff' }); txt(m.due, dx + 8.4, 8.8, { s: 1.9, c: '#fff' });
    const tt = String(m.title).toUpperCase(); font(400, 11.5, IMP); const nat = x.measureText(tt).width / u, ts = Math.min(11.5 * 1.5, 11.5 * (100 - 38.7 - 3.5) / nat * 0.97);
    x.font = `400 ${ts * u}px ${IMP}`; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    const asc = x.measureText(tt).actualBoundingBoxAscent || ts * u * 0.75, base = 22.4 * u + asc / 2;
    const g = x.createLinearGradient(0, base - asc, 0, base); g.addColorStop(0, '#fff'); g.addColorStop(1, '#b9b9b9'); x.fillStyle = g; x.fillText(tt, 38.7 * u, base);

    /* client */
    txt('INVOICE TO:', 9, 39, { s: 2.4, w: 600 }); txt(String(m.client.name || 'CLIENT NAME').toUpperCase(), 9, 44.6, { s: 5.6, w: 700, max: 84 });
    let y = 50; [m.client.business, m.client.email, m.client.phone].filter(Boolean).forEach((t) => { txt(t, 9, y, { s: 2, c: '#111', max: 84 }); y += 2.8; });
    y = Math.max(y + 3, 56.6);

    /* table */
    const tx = 8.9, tw = 82.2, cw = [0.32, 0.17, 0.17, 0.17, 0.17].map((p) => p * tw), heads = ['Description', 'Package', 'Qty', 'Price', 'Subtotal'], hh = 7.4 * Math.max(k, 0.85);
    let cx = tx; heads.forEach((h, i) => { rect(cx, y, cw[i] - 0.4, hh, BL); txt(h, i ? cx + cw[i] / 2 : cx + 1.6, y + hh / 2, { s: 2.6, c: '#fff', a: i ? 'center' : 'left', max: cw[i] - 2 }); cx += cw[i]; });
    y += hh;
    m.items.forEach((it) => {
      const sz = 2, dl = wrap(it.desc || '-', 400, sz, cw[0] - 3), pl = wrap(it.pkg || '', 400, sz, cw[1] - 2), n = Math.max(dl.length, pl.length, 1), lh = 2.8 * k, rh = Math.max(7 * k, n * lh + 3 * k);
      let c2 = tx; const top = y + (rh - dl.length * lh) / 2 + lh / 2;
      dl.forEach((t, i) => txt(t, c2 + 1.6, top + i * lh, { s: sz, c: '#111' })); c2 += cw[0];
      const pt = y + (rh - pl.length * lh) / 2 + lh / 2; pl.forEach((t, i) => txt(t, c2 + cw[1] / 2, pt + i * lh, { s: sz, c: '#111', a: 'center' })); c2 += cw[1];
      const mid = y + rh / 2;
      txt(it.qty, c2 + cw[2] / 2, mid, { s: sz, c: '#111', a: 'center', max: cw[2] - 2 }); c2 += cw[2];
      txt(it.price, c2 + cw[3] / 2, mid, { s: sz, c: '#111', a: 'center', max: cw[3] - 2 }); c2 += cw[3];
      txt(it.line, c2 + cw[4] / 2, mid, { s: sz, w: 600, c: '#111', a: 'center', max: cw[4] - 2 });
      y += rh; rect(tx, y, tw - 0.4, 0.12, '#dcdcdc');
    });

    /* notes */
    if (m.notes && m.notes.trim()) {
      y += 4.6 * k; txt('PROJECT NOTES', 9, y, { s: 1.7, w: 600, c: BL }); y += 3.2 * k;
      wrap(m.notes, 400, 1.8, 82).slice(0, 6).forEach((t) => { txt(t, 9, y, { s: 1.8, c: '#333' }); y += 2.6 * k; });
    }
    y = Math.max(y + 2 * k, 83.1); rect(5.4, y, 89.2, 1, '#555'); y = Math.max(y + 1 + 3.4 * k, 94);

    /* totals bands (same sizes as the website) */
    const bh = 7.1;
    m.bands.forEach((b, i) => {
      const blue = i % 2 === 0 || i === m.bands.length - 1; rect(0, y, 100, bh, blue ? BL : '#fff');
      txt(b[0], 3.6, y + bh / 2, { s: 2.7, w: 600, c: blue ? '#fff' : '#000' }); txt(b[1], 95, y + bh / 2, { s: 2.3, c: blue ? '#fff' : '#000', a: 'right', max: 60 }); y += bh;
    });
    rect(0, y, 100, 135.4 - y, '#fff');           // white footer, edge to edge, like the website
    y += 4 * k;

    /* footer: grey pill, payment info, signature */
    const lines = wrap(m.gray, 500, 1.7, 49), lh = 2.4, ph = lines.length * lh + 2.8; rr(4, y, 54, ph, 2.6, '#767676');
    lines.forEach((s, i) => txt(s, 31, y + 1.4 + (i + 0.5) * lh, { s: 1.7, w: 500, c: '#fff', a: 'center' })); y += ph + 3.4 * k;
    const block = (title, ls, link) => {
      if (!ls.length) return; txt(title, 9, y, { s: 1.7, w: 600, c: BL }); y += 3 * k;
      ls.forEach((t) => { const r = txt(t, 9, y, { s: 1.8, c: link ? BL : '#222' }); if (link) links.push({ x: r.x, y: y - 1.4, w: r.w, h: 2.8, uri: link }); y += 2.6 * k; }); y += 1.4 * k;
    };
    if (m.paid) block('PAYMENT RECEIVED', ['Thank you. This invoice has been paid in full.'].concat(m.paymentRef ? ['Reference: ' + m.paymentRef] : []));
    else { if (m.payLink) block('PAY ONLINE (Paystack secure link)', wrap(m.payLink, 400, 1.8, 62), m.payLink); block('PAYMENT DETAILS', (m.payDetails || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)); }
    if (m.terms) block('NOTES', wrap(m.terms, 400, 1.7, 62));
    const contact = [m.biz.phone, m.biz.email].filter(Boolean).join('  ·  '); if (contact) txt(contact, 9, 133.1, { s: 1.5, c: '#444', max: 58 });
    rect(75, 131.2, 21, 0.35, '#111'); txt('Authorized Signed', 85.5, 133.1, { s: 1.5, i: true, c: '#111', a: 'center' });
    return { k, overflow: y > 130.4, links };
  }
  root.IVInvoice = { draw, PAGE };
})(typeof window !== 'undefined' ? window : globalThis);

/* Implify Visuals invoice renderer: same design, fonts and measurements as the invoice on the main website
   (checkout/booking). ONE routine draws the live preview AND the PDF, so they are always identical.
   u = 1% of page width; A4 = 100 x 141.42 u. Always a single page (flowing content scales to fit). */
(function (root) {
  'use strict';
  const BL = '#005fff', PAGE = 141.42, SANS = '"Inter Tight","Helvetica Neue",Helvetica,Arial,sans-serif', IMP = 'Impact,Anton,"Haettenschweiler","Arial Narrow Bold",sans-serif';

  const validPay = (u) => { try { const p = new URL(u); return p.protocol === 'https:' && /(^|\.)paystack\.(com|shop|co)$/i.test(p.hostname); } catch (_) { return false; } };

  /* Bank logos drawn in code (transparent background). Each returns its width in units; w=true only measures. */
  function bankLogo(x, u, key, ox, oy, h, measure) { x.save(); try { return bankLogoDraw(x, u, key, ox, oy, h, measure); } finally { x.restore(); } }
  function bankLogoDraw(x, u, key, ox, oy, h, measure) {
    const f = (wt, s) => { x.font = `${wt} ${(s * u).toFixed(2)}px ${SANS}`; }, tw = (t, wt, s) => { f(wt, s); return x.measureText(t).width / u; };
    x.textBaseline = 'middle'; x.textAlign = 'left';
    if (key === 'grey') {
      const s = h * 0.82, wd = tw('Grey', 700, s) + 0.06 * h, sym = h * 0.92, W = sym + h * 0.22 + wd; if (measure) return W;
      const cx = ox + sym / 2, cy = oy + h / 2, R = sym * 0.36; x.save(); x.strokeStyle = '#000'; x.fillStyle = '#000'; x.lineCap = 'butt';
      x.lineWidth = sym * 0.2 * u; x.beginPath(); x.arc(cx * u, cy * u, R * u, -0.35 * Math.PI, 1.55 * Math.PI, false); x.stroke();
      x.fillRect((cx - 0.02 * sym) * u, (cy - 0.07 * sym) * u, sym * 0.3 * u, sym * 0.14 * u);
      f(700, s); x.lineWidth = 0.05 * h * u; x.lineJoin = 'round'; x.strokeText('Grey', (ox + sym + h * 0.22) * u, (oy + h * 0.53) * u); x.fillText('Grey', (ox + sym + h * 0.22) * u, (oy + h * 0.53) * u); x.restore(); return W;
    }
    if (key === 'moniepoint') {
      const s = h * 0.62, a = tw('Monie', 700, s), b2 = tw('point', 400, s), W = h + h * 0.24 + a + b2; if (measure) return W;
      x.save(); x.fillStyle = '#0a5cf5'; x.beginPath(); const rx = ox * u, ry = oy * u, sz = h * u, rad = h * 0.3 * u; x.moveTo(rx + rad, ry); x.arcTo(rx + sz, ry, rx + sz, ry + sz, rad); x.arcTo(rx + sz, ry + sz, rx, ry + sz, rad); x.arcTo(rx, ry + sz, rx, ry, rad); x.arcTo(rx, ry, rx + sz, ry, rad); x.fill();
      x.fillStyle = '#fff'; f(700, h * 0.66); x.textAlign = 'center'; x.fillText('M', (ox + h / 2) * u, (oy + h * 0.53) * u);
      x.textAlign = 'left'; x.fillStyle = '#0d0d0d'; f(700, s); x.fillText('Monie', (ox + h * 1.24) * u, (oy + h * 0.53) * u); f(400, s); x.fillText('point', (ox + h * 1.24 + a) * u, (oy + h * 0.53) * u); x.restore(); return W;
    }
    if (key === 'payoneer') {
      const s = h * 0.74, a = tw('Payoneer', 600, s), W = h * 0.95 + h * 0.2 + a; if (measure) return W;
      const cx = ox + h * 0.475, cy = oy + h / 2, R = h * 0.36; x.save(); x.lineWidth = h * 0.15 * u; x.lineCap = 'butt';
      for (let i = 0; i < 48; i++) { const t0 = (i / 48) * 2 * Math.PI - Math.PI / 2, t1 = t0 + (2 * Math.PI / 48) * 1.15; x.strokeStyle = `hsl(${(14 + i * 7.2) % 360},92%,56%)`; x.beginPath(); x.arc(cx * u, cy * u, R * u, t0, t1); x.stroke(); }
      x.fillStyle = '#26262c'; f(600, s); x.fillText('Payoneer', (ox + h * 1.15) * u, (oy + h * 0.53) * u); x.restore(); return W;
    }
    if (key === 'zenith') {
      const mw = h * 0.7, s = h * 0.27, a = tw('ZENITH', 700, s), W = Math.max(mw, a) + 0.2 * h; if (measure) return W;
      const px = ox + (W - mw) / 2, py = oy, ph = h * 0.7, P = (pts) => pts.forEach((p, i) => x[i ? 'lineTo' : 'moveTo']((px + p[0] / 100 * mw) * u, (py + p[1] / 100 * ph) * u));
      x.save(); x.beginPath(); P([[22, 0], [100, 0], [8, 74], [0, 66], [46, 22], [18, 22]]); x.closePath(); x.fillStyle = '#808285'; x.fill();
      x.beginPath(); P([[4, 100], [98, 22], [92, 60], [100, 72], [96, 100]]); x.closePath(); x.fillStyle = '#ed1c24'; x.fill();
      x.fillStyle = '#808285'; f(700, s); x.textAlign = 'center'; x.fillText('ZENITH', (ox + W / 2) * u, (oy + h * 0.87) * u); x.restore(); return W;
    }
    return 0;
  }
  function draw(canvas, m, opt) {
    opt = opt || {};
    /* A4 when the content fits; otherwise the page grows taller (up to MAXEXT units) so nothing is cramped. */
    const MAXEXT = 150, W = Math.round((opt.width || 600) * (opt.dpr || 1)), u = W / 100;
    canvas.width = W; canvas.height = Math.round(W * PAGE / 100);
    const ctx = canvas.getContext('2d'); let r = null, k = 1;
    for (; k >= 0.85; k -= 0.05) { r = paint(ctx, u, k, m, opt.logo, 0); if (r.need <= 0.05) break; }   /* a slight squeeze keeps A4 when that is enough */
    if (r.need > 0.05) { k = 1; r = paint(ctx, u, 1, m, opt.logo, 0); }
    const ext = Math.max(0, Math.min(MAXEXT, r.need));
    if (ext > 0.01) { canvas.width = W; canvas.height = Math.round(W * (PAGE + ext) / 100); r = paint(ctx, u, k, m, opt.logo, ext); }
    r.overflow = r.need - ext > 0.05; r.height = PAGE + ext;
    return r;
  }

  function paint(x, u, k, m, logo, ext) {
    ext = ext || 0;
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
    rect(0, 0, 100, PAGE + ext, BL); rect(5.4, 7.3, 89.2, 128 + ext, '#fff');
    x.beginPath(); x.moveTo(34.7 * u, 0); x.lineTo(W, 0); x.lineTo(W, 33.9 * u); x.lineTo(43.7 * u, 33.9 * u); x.arcTo(34.7 * u, 33.9 * u, 34.7 * u, 24.9 * u, 9 * u); x.lineTo(34.7 * u, 0); x.fillStyle = BL; x.fill();
    if (logo && logo.complete && logo.naturalWidth) { const lc = document.createElement('canvas'); lc.width = lc.height = Math.max(1, Math.round(13 * u)); const lx = lc.getContext('2d'); lx.drawImage(logo, 0, 0, lc.width, lc.height); lx.globalCompositeOperation = 'source-in'; lx.fillStyle = BL; lx.fillRect(0, 0, lc.width, lc.height); x.drawImage(lc, 13.55 * u, 12 * u, 13 * u, 13 * u); }
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
    let y = 50; const cl = [m.client.email, m.client.phone, m.client.business].filter(Boolean).join(' \u00b7 '); if (cl) { txt(cl, 9, y, { s: 2, c: '#111', max: 84 }); y += 2.8; }
    y = Math.max(y + 3, 56.6);

    /* table */
    const tx = 8.9, tw = 82.2, cw = [0.32, 0.17, 0.17, 0.17, 0.17].map((p) => p * tw), heads = ['Description', 'Package', 'Qty', 'Price', 'Subtotal'], hh = 7.4 * Math.max(k, 0.85);
    let cx = tx; heads.forEach((h, i) => { rect(cx, y, cw[i] - 0.4, hh, BL); txt(h, i ? cx + cw[i] / 2 : cx + 1.6, y + hh / 2, { s: 2.6, c: '#fff', a: i ? 'center' : 'left', max: cw[i] - 2 }); cx += cw[i]; });
    y += hh;
    m.items.forEach((it) => {
      const sz = 2, dl = wrap(it.desc || '-', 400, sz, cw[0] - 3), pl = wrap(it.pkg || '', 400, sz, cw[1] - 2), n = Math.max(dl.length, pl.length, 1), lh = 2.8 * k, rh = Math.max(8.4 * k, n * lh + 3.4 * k);
      let c2 = tx; const top = y + (rh - dl.length * lh) / 2 + lh / 2;
      dl.forEach((t, i) => txt(t, c2 + 1.6, top + i * lh, { s: sz, c: '#111' })); c2 += cw[0];
      const pt = y + (rh - pl.length * lh) / 2 + lh / 2; pl.forEach((t, i) => txt(t, c2 + cw[1] / 2, pt + i * lh, { s: sz, c: '#111', a: 'center' })); c2 += cw[1];
      const mid = y + rh / 2;
      txt(it.qty, c2 + cw[2] / 2, mid, { s: sz, c: '#111', a: 'center', max: cw[2] - 2 }); c2 += cw[2];
      txt(it.price, c2 + cw[3] / 2, mid, { s: sz, c: '#111', a: 'center', max: cw[3] - 2 }); c2 += cw[3];
      txt(it.line, c2 + cw[4] / 2, mid, { s: sz, w: 600, c: '#111', a: 'center', max: cw[4] - 2 });
      y += rh;
    });

    /* notes */
    if (m.notes && m.notes.trim()) {
      y += 4 * k; txt('PROJECT NOTES', 9, y, { s: 1.7, w: 600, c: BL }); y += 3.2 * k;
      wrap(m.notes, 400, 1.8, 82).slice(0, 16).forEach((t) => { txt(t, 9, y, { s: 1.8, c: '#333' }); y += 2.6 * k; });
    }
    y = Math.max(y + 2 * k, 83.1); rect(5.4, y, 89.2, 1, '#555'); y = Math.max(y + 1 + 3.4 * k, 94);

    /* totals bands (same sizes as the website) */
    const bh = 7.1;
    m.bands.forEach((b, i) => {
      const blue = i % 2 === 0 || i === m.bands.length - 1; rect(0, y, 100, bh, blue ? BL : '#fff');
      txt(b[0], 3.6, y + bh / 2, { s: 2.7, w: 600, c: blue ? '#fff' : '#000' }); txt(b[1], 95, y + bh / 2, { s: 2.3, c: blue ? '#fff' : '#000', a: 'right', max: 60 }); y += bh;
    });
    rect(0, y, 100, 135.4 + ext - y, '#fff');           // white footer, edge to edge, like the website
    const unpaid = !m.paid, FS = unpaid ? 1.2 : 0, pillTop = y + (unpaid ? 3.7 : 6.1); y = pillTop;

    /* footer: grey pill, payment info, signature */
    const lines = wrap(m.gray, 500, 1.7, 49), lh = 2.4, ph = lines.length * lh + 2.8; rr(4, y, 54, ph, 1.5, '#767676');
    lines.forEach((s, i) => txt(s, 31, y + 1.4 + (i + 0.5) * lh, { s: 1.7, w: 500, c: '#fff', a: 'center' }));
    if (unpaid && m.showPay !== false) {
      y += ph + 1.4; const bh2 = 5, ok = m.payLink && validPay(m.payLink);
      rr(4, y, 54, bh2, 1.5, ok ? BL : '#b45309');
      txt(ok ? 'CLICK HERE TO PAY ONLINE' : 'Payment link required before sending', 31, y + bh2 / 2, { s: ok ? 2 : 1.6, w: 700, c: '#fff', a: 'center', max: 50 });
      if (ok) {
        links.push({ x: 3, y: y - 0.9, w: 56, h: bh2 + 1.8, uri: m.payLink });
        const q = root.IVQR && root.IVQR.encode(m.payLink), qs = 10, qx = 80.5, qy = pillTop;
        if (q) { const mod = qs / q.length; x.fillStyle = '#000'; q.forEach((row, ry) => row.forEach((on, c2) => { if (on) x.fillRect((qx + c2 * mod) * u, (qy + ry * mod) * u, mod * u + 0.6, mod * u + 0.6); })); txt('Scan to pay securely', qx + qs / 2, qy - 1.7, { s: 1.4, w: 500, c: '#222', a: 'center' }); }
      }
      y += bh2 + 1.2 * k;
    } else y += ph + 3.4 * k;
    const block = (title, ls, link) => {
      if (!ls.length) return; txt(title, 9, y, { s: 1.7, w: 600, c: BL }); y += 3 * k;
      ls.forEach((t) => { const r = txt(t, 9, y, { s: 1.8, c: link ? BL : '#222' }); if (link) links.push({ x: r.x, y: y - 1.4, w: r.w, h: 2.8, uri: link }); y += 2.6 * k; }); y += 1.4 * k;
    };
    if (m.paid) block('PAYMENT RECEIVED', ['Thank you. This invoice has been paid in full.'].concat(m.paymentRef ? ['Reference: ' + m.paymentRef] : []));
    else if (m.bank) {
      const b = m.bank, rows = b.rows || [], nl = b.note ? wrap(b.note, 400, 1.7, 84) : [], cr = Math.ceil(rows.length / 2);
      const lg = b.logo || null, lx = lg ? 1.4 : 0;
      const ch = 1.6 + 3.8 + lx + cr * 6.8 + (nl.length ? nl.length * 2.5 + 1.2 : 0) + 1.4;
      y += 1.2; rr(4, y, 92, ch, 2, '#eef3ff'); txt(b.title, 7, y + 3.6, { s: 1.7, w: 700, c: BL });
      if (lg) { const lh = 6.4, lw = Math.min(34, bankLogo(x, u, lg, 0, 0, lh, true)); bankLogo(x, u, lg, 96 - 2.4 - lw, y + 1.6, lh, false); }
      const r0 = y + 8.4 + lx;
      rows.forEach((rw, i) => { const cx2 = i % 2 ? 51 : 7, cy = r0 + Math.floor(i / 2) * 6.8; txt(rw[0], cx2, cy, { s: 1.3, w: 600, c: '#5b6b8c' }); txt(rw[1], cx2, cy + 2.9, { s: 2, w: 600, c: '#111', max: 41 }); });
      nl.forEach((t, i) => txt(t, 7, r0 + cr * 6.8 - 1.4 + i * 2.5 + 1, { s: 1.7, c: '#333' }));
      y += ch + 2.4;
    }
    if (m.terms) block('NOTES', wrap(m.terms, 400, 1.7, 62));
    
    rect(75, 131.2 + FS + ext, 21, 0.35, '#111'); txt('Authorized Signed', 85.5, 133.1 + FS + ext, { s: 1.5, i: true, c: '#111', a: 'center' });
    return { k, need: Math.max(0, y - (unpaid ? 132.6 : 130.4)), links };
  }
  root.IVInvoice = { draw, PAGE };
})(typeof window !== 'undefined' ? window : globalThis);

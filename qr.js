/* Minimal dependency-free QR encoder (byte mode, error correction M, versions 1-10). Returns a boolean matrix. */
(function (root) {
  'use strict';
  const EC = [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, v = 1; i < 255; i++) { EXP[i] = v; LOG[v] = i; v <<= 1; if (v & 256) v ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  function rs(data, n) {
    let g = [1];
    for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); g.forEach((c, j) => { ng[j] ^= c; ng[j + 1] ^= mul(c, EXP[i]); }); g = ng; }
    const r = new Array(n).fill(0);
    data.forEach((d) => { const f = d ^ r[0]; r.shift(); r.push(0); if (f) for (let j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); });
    return r;
  }
  const dataCw = (v) => EC[v][1].reduce((t, b) => t + b[0] * b[1], 0);
  function bch(v, g, gb) { let d = v << (gb - 1 + 0); let r = v; const top = (x) => 31 - Math.clz32(x); let x = v << top(g); while (top(x) >= top(g)) x ^= g << (top(x) - top(g)); return x; }
  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 0; for (let v = 1; v <= 10; v++) { const cap = dataCw(v) * 8 - 4 - (v < 10 ? 8 : 16); if (bytes.length * 8 <= cap) { ver = v; break; } }
    if (!ver) throw new Error('QR: text too long');
    const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
    const cap = dataCw(ver) * 8; for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0); while (bits.length % 8) bits.push(0);
    const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0; cw.length < dataCw(ver); p++) cw.push(p % 2 ? 0x11 : 0xec);
    const [ecn, groups] = EC[ver], blocks = []; let pos = 0;
    groups.forEach(([cnt, len]) => { for (let i = 0; i < cnt; i++) { const d = cw.slice(pos, pos + len); pos += len; blocks.push({ d, e: rs(d, ecn) }); } });
    const out = []; const maxd = Math.max(...blocks.map((b) => b.d.length));
    for (let i = 0; i < maxd; i++) blocks.forEach((b) => { if (i < b.d.length) out.push(b.d[i]); });
    for (let i = 0; i < ecn; i++) blocks.forEach((b) => out.push(b.e[i]));
    const stream = []; out.forEach((b) => { for (let i = 7; i >= 0; i--) stream.push((b >> i) & 1); });
    const n = 17 + 4 * ver, M = [], F = [];
    for (let i = 0; i < n; i++) { M.push(new Array(n).fill(false)); F.push(new Array(n).fill(false)); }
    const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < n && c < n) { M[r][c] = v; F[r][c] = true; } };
    const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) set(r + i, c + j, i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))); };
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    const al = ALIGN[ver]; al.forEach((r) => al.forEach((c) => { if (F[r][c]) return; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) set(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1); }));
    for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    set(n - 8, 8, true);
    for (let i = 0; i < 9; i++) { if (!F[8][i]) set(8, i, false); if (!F[i][8]) set(i, 8, false); }
    for (let i = 0; i < 8; i++) { set(8, n - 1 - i, false); set(n - 1 - i, 8, false); }
    if (ver >= 7) { const vi = (ver << 12) | bch(ver, 0x1f25); for (let i = 0; i < 18; i++) { const b = ((vi >> i) & 1) === 1, a = Math.floor(i / 3), c = n - 11 + (i % 3); set(a, c, b); set(c, a, b); } }
    const place = (mask) => {
      const G = M.map((r) => r.slice()); let i = 0, up = true;
      for (let c = n - 1; c > 0; c -= 2) { if (c === 6) c--; for (let k = 0; k < n; k++) { const r = up ? n - 1 - k : k; for (let d = 0; d < 2; d++) { const cc = c - d; if (F[r][cc]) continue; let b = stream[i++] === 1; const mk = [(r + cc) % 2 === 0, r % 2 === 0, cc % 3 === 0, (r + cc) % 3 === 0, (Math.floor(r / 2) + Math.floor(cc / 3)) % 2 === 0, ((r * cc) % 2) + ((r * cc) % 3) === 0, (((r * cc) % 2) + ((r * cc) % 3)) % 2 === 0, (((r + cc) % 2) + ((r * cc) % 3)) % 2 === 0][mask]; if (mk) b = !b; G[r][cc] = b; } } up = !up; }
      const fmt = (((0 << 3) | mask) << 10); const f = (((0 << 3) | mask) << 10 | bch((0 << 3) | mask, 0x537)) ^ 0x5412;
      // EC level M = 00
      for (let k = 0; k < 15; k++) { const b = ((f >> k) & 1) === 1; if (k < 6) G[k][8] = b; else if (k < 8) G[k + 1][8] = b; else G[n - 15 + k][8] = b; if (k < 8) G[8][n - 1 - k] = b; else if (k < 9) G[8][15 - k] = b; else G[8][14 - k] = b; }
      G[n - 8][8] = true; return G;
    };
    const pen = (G) => { let p = 0; for (let t = 0; t < 2; t++) for (let a = 0; a < n; a++) { let run = 1; for (let b = 1; b < n; b++) { const x = t ? G[b][a] : G[a][b], y = t ? G[b - 1][a] : G[a][b - 1]; if (x === y) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (G[r][c] === G[r + 1][c] && G[r][c] === G[r][c + 1] && G[r][c] === G[r + 1][c + 1]) p += 3;
      let dark = 0; G.forEach((r) => r.forEach((v) => { if (v) dark++; })); p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10; return p; };
    let best = null, bp = 1e9; for (let m = 0; m < 8; m++) { const G = place(m), p = pen(G); if (p < bp) { bp = p; best = G; } }
    return best;
  }
  root.IVQR = { encode };
  if (typeof module !== 'undefined') module.exports = root.IVQR;
})(typeof window !== 'undefined' ? window : globalThis);

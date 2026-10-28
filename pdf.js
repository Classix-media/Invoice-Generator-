/* Implify Visuals invoice PDF writer: wraps the rendered A4 invoice page (JPEG) in a one-page PDF,
   with the payment link kept clickable. Dependency-free. */
(function (root) {
  const PW = 595.28, PH = 841.89, U = PW / 100, f2 = (n) => (+n).toFixed(2);
  const esc = (s) => String(s).replace(/[^\x20-\x7e]/g, '?').replace(/([()\\])/g, '\\$1');
  function buildImagePdf(jpeg, iw, ih, links, info) {
    const enc = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
    const parts = [], offs = []; let len = 0;
    const push = (d) => { const u8 = typeof d === 'string' ? enc(d) : d; parts.push(u8); len += u8.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); push(body); push('\nendobj\n'); };
    links = links || []; const annots = links.map((_, i) => 6 + i), infoN = 6 + links.length;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<</Type/Catalog/Pages 2 0 R>>'); obj(2, '<</Type/Pages/Kids[3 0 R]/Count 1>>');
    obj(3, `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</XObject<</Im0 5 0 R>>>>/Contents 4 0 R${annots.length ? '/Annots[' + annots.map((a) => a + ' 0 R').join(' ') + ']' : ''}>>`);
    const cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`; obj(4, `<</Length ${cs.length}>>\nstream\n${cs}\nendstream`);
    offs[5] = len; push(`5 0 obj\n<</Type/XObject/Subtype/Image/Width ${iw}/Height ${ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`); push(jpeg); push('\nendstream\nendobj\n');
    links.forEach((l, i) => obj(annots[i], `<</Type/Annot/Subtype/Link/Rect[${f2(l.x * U)} ${f2(PH - (l.y + l.h) * U)} ${f2((l.x + l.w) * U)} ${f2(PH - l.y * U)}]/Border[0 0 0]/A<</S/URI/URI(${esc(l.uri)})>>>>`));
    obj(infoN, `<</Title(${esc(info.title || '')})/Author(${esc(info.author || '')})/Producer(Implify Visuals Invoice)>>`);
    const total = infoN + 1, xr = len; push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let i = 1; i < total; i++) push(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
    push(`trailer\n<</Size ${total}/Root 1 0 R/Info ${infoN} 0 R>>\nstartxref\n${xr}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  root.IVPdf = { buildImagePdf };
  if (typeof module !== 'undefined') module.exports = root.IVPdf;
})(typeof window !== 'undefined' ? window : globalThis);

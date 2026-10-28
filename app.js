(function () {
  const $ = (id) => document.getElementById(id), C = window.IVCalc, P = window.IVPdf;
  const LS = { inv: 'ivgen.invoices', set: 'ivgen.settings', theme: 'ivgen.theme' };
  const DEFAULTS = { name: 'Implify Visuals', email: 'chibuikeisrael587@gmail.com', phone: '+234 812 198 6430', paymentDetails: '', terms: '', currency: 'NGN', next: 1 };
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { toast('Could not save on this browser (storage full or blocked).'); return false; } };
  let settings = Object.assign({}, DEFAULTS, read(LS.set, {})), invoices = read(LS.inv, []), cur = null, logo = null, filter = 'all';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(36).slice(2));
  const pad = (n) => 'IV-' + String(n).padStart(4, '0');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tt; function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); }
  const say = (id, m, cls) => { const e = $(id); e.textContent = m || ''; e.className = 'msg' + (cls ? ' ' + cls : ''); };

  /* ---------- theme ---------- */
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); $('themeIcon').textContent = t === 'dark' ? '☀️' : '🌙'; $('themeTxt').textContent = t === 'dark' ? 'Light' : 'Dark'; $('themeColor').content = t === 'dark' ? '#060b1a' : '#005fff'; }
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  $('themeBtn').onclick = () => { const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(LS.theme, t); } catch (_) {} applyTheme(t); };
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!localStorage.getItem(LS.theme)) applyTheme(e.matches ? 'dark' : 'light'); }); } catch (_) {}

  /* ---------- auth ---------- */
  async function api(path, data) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(data || {}) });
    const j = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, j };
  }
  function showLogin(msg) { $('appView').hidden = true; $('loginView').hidden = false; $('lockBtn').hidden = true; if (msg) say('loginMsg', msg, 'bad'); }
  function showApp() { $('loginView').hidden = true; $('appView').hidden = false; $('lockBtn').hidden = false; init(); }
  async function boot() {
    try { const r = await fetch('/api/session', { credentials: 'same-origin' }); if (r.ok) return showApp(); const j = await r.json().catch(() => ({})); showLogin(j.error === 'not_configured' ? 'Access is not set up yet. Add INVOICE_PASSWORD and INVOICE_SESSION_SECRET in Vercel.' : ''); }
    catch (_) { showLogin('Cannot reach the server. Check your connection.'); }
  }
  $('loginForm').onsubmit = async (e) => {
    e.preventDefault(); $('loginBtn').disabled = true; say('loginMsg', 'Checking…');
    try { const r = await api('/api/login', { password: $('pw').value }); $('pw').value = '';
      if (r.ok) { say('loginMsg', ''); showApp(); } else say('loginMsg', r.j.error === 'not_configured' ? 'Access is not set up yet in Vercel.' : 'Wrong password.', 'bad'); }
    catch (_) { say('loginMsg', 'Network problem. Try again.', 'bad'); }
    $('loginBtn').disabled = false;
  };
  $('lockBtn').onclick = async () => { try { await api('/api/logout'); } catch (_) {} showLogin(); };

  /* ---------- invoice model ---------- */
  function blank() {
    const t = today();
    return { id: uid(), number: pad(settings.next), status: 'draft', currency: settings.currency || 'NGN', issue: t, due: addDays(t, 7),
      client: { name: '', email: '', phone: '', business: '' }, items: [{ desc: '', pkg: '', qty: '1', price: '' }], notes: '', discountType: 'amount', discountValue: '', taxPct: '',
      paymentLink: '', paymentRef: '', linkAmount: null, linkCurrency: '', paidAt: '', createdAt: Date.now(), updatedAt: Date.now(), autoNumber: true };
  }
  const effStatus = (inv) => (inv.status === 'awaiting' && inv.due && inv.due < today() ? 'overdue' : inv.status);
  const LABEL = { draft: 'Draft', awaiting: 'Awaiting payment', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };

  function readForm() {
    const i = cur; i.client = { name: $('cName').value.trim(), email: $('cEmail').value.trim(), phone: $('cPhone').value.trim(), business: $('cBiz').value.trim() };
    i.number = $('iNum').value.trim() || i.number; i.currency = $('iCur').value; i.issue = $('iIssue').value; i.due = $('iDue').value;
    i.items = [...document.querySelectorAll('#items .item')].map((el) => ({ desc: el.querySelector('.d').value, pkg: el.querySelector('.p').value, qty: el.querySelector('.q').value, price: el.querySelector('.r').value }));
    i.notes = $('iNotes').value; i.discountType = $('dType').value; i.discountValue = $('dVal').value; i.taxPct = $('tPct').value; i.paymentLink = $('payLink').value.trim();
  }
  function itemHtml(it, idx, n) {
    return `<div class="item"><button type="button" class="rm" ${n < 2 ? 'hidden' : ''}>Remove</button><strong class="small muted">Line item ${idx + 1}</strong>
      <label>Project / service name</label><input class="d" value="${esc(it.desc)}" placeholder="e.g. Brand Identity Design">
      <label>Package (optional)</label><input class="p" value="${esc(it.pkg)}" placeholder="e.g. Premium">
      <div class="row2"><div><label>Quantity</label><input class="q" inputmode="decimal" value="${esc(it.qty)}"></div><div><label>Unit price</label><input class="r" inputmode="decimal" value="${esc(it.price)}" placeholder="0.00"></div></div></div>`;
  }
  function renderItems() { const box = $('items'); box.innerHTML = cur.items.map((it, k) => itemHtml(it, k, cur.items.length)).join('');
    box.querySelectorAll('.rm').forEach((b, k) => b.onclick = () => { readForm(); cur.items.splice(k, 1); renderItems(); refresh(); }); }
  function fillForm() {
    const i = cur; $('cName').value = i.client.name; $('cEmail').value = i.client.email; $('cPhone').value = i.client.phone; $('cBiz').value = i.client.business;
    $('iNum').value = i.number; $('iCur').value = i.currency; $('iIssue').value = i.issue; $('iDue').value = i.due; $('iNotes').value = i.notes;
    $('dType').value = i.discountType; $('dVal').value = i.discountValue; $('tPct').value = i.taxPct; $('payLink').value = i.paymentLink; renderItems(); refresh();
  }

  /* ---------- preview + totals ---------- */
  const view = () => { const calc = C.compute(cur); return { calc, fm: (m) => C.fmt(m, cur.currency) }; };
  function invModel() {
    const { calc, fm } = view(), paid = cur.status === 'paid';
    const bands = [['SUBTOTAL:', fm(calc.subtotal)], ['DISCOUNT:', calc.discount > 0 ? '-' + fm(calc.discount) : '—']];
    if (calc.tax > 0) bands.push([`TAX (${C.num(cur.taxPct, 100)}%):`, fm(calc.tax)]);
    bands.push([paid ? 'TOTAL PAID:' : 'TOTAL DUE:', fm(calc.total)]);
    return { paid, title: paid ? 'PAID INVOICE' : 'INVOICE', number: cur.number, issue: C.dateText(cur.issue), due: C.dateText(cur.due),
      biz: { name: settings.name, phone: settings.phone, email: settings.email }, client: cur.client,
      items: cur.items.map((it, k) => ({ desc: it.desc, pkg: it.pkg, qty: String(C.num(it.qty)), price: fm(C.toMinor(it.price)), line: fm(calc.lines[k]) })),
      notes: cur.notes, bands, gray: 'Payment is required before project work begins.' + (cur.status === 'cancelled' ? ' This invoice has been cancelled.' : ''),
      payLink: cur.paymentLink, paymentRef: cur.paymentRef, payDetails: (settings.paymentDetails || '').trim(), terms: settings.terms };
  }
  function drawPreview() {
    const cv = $('invCanvas'), wrap = $('invWrap'); if (!cv || !cur) return;
    const w = wrap.clientWidth || 360, r = window.IVInvoice.draw(cv, invModel(), { width: w, dpr: Math.min(window.devicePixelRatio || 1, 2.5), logo });
    const f = $('fitWarn'); f.hidden = !r.overflow;
  }
  function renderPreview() {
    const { calc, fm } = view(), paid = cur.status === 'paid';
    drawPreview();
    $('totalsBox').innerHTML = `<div><span>Subtotal</span><span>${fm(calc.subtotal)}</span></div><div><span>Discount</span><span>${calc.discount ? '-' + fm(calc.discount) : '—'}</span></div>${calc.tax ? `<div><span>Tax</span><span>${fm(calc.tax)}</span></div>` : ''}<div class="t"><span>${paid ? 'Total paid' : 'Total due'}</span><span>${fm(calc.total)}</span></div>`;
    const w = $('calcWarn'); w.hidden = !calc.warnings.length; w.textContent = calc.warnings.join(' ');
  }
  let rz; try { new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(drawPreview); }).observe($('invWrap')); } catch (_) {}
  const ensureFonts = () => Promise.all(['400 20px Anton', '400 20px "Inter Tight"', '500 20px "Inter Tight"', '600 20px "Inter Tight"', '700 20px "Inter Tight"'].map((f) => document.fonts.load(f))).then(() => document.fonts.ready).catch(() => {});
  ensureFonts().then(() => drawPreview());
  function renderStatus() {
    const s = effStatus(cur), b = $('statusBadge'); { const v = view(); $('sumTotal').textContent = v.fm(v.calc.total); $('sumStatus').innerHTML = `<span class="badge ${s}">${LABEL[s]}</span>`; $('sumDue').textContent = cur.due ? C.dateText(cur.due) : '—'; $('sumClient').textContent = cur.client.name || '—'; } b.textContent = LABEL[s]; b.className = 'badge ' + s;
    $('checkPay').disabled = !(cur.paymentRef && cur.status !== 'paid'); $('makeLink').disabled = cur.status === 'paid';
    const stale = cur.paymentRef && cur.linkAmount != null && (Math.round(cur.linkAmount * 100) !== view().calc.total || cur.linkCurrency !== cur.currency);
    if (stale) say('linkMsg', 'The total changed after this link was created. Create a new link before sending, or the client will be asked for the old amount.', 'warn');
    else if (cur.paymentLink && !cur.paymentRef) say('linkMsg', 'Manual link: payment cannot be verified here, so this invoice stays “awaiting payment”.', '');
  }
  function numberCheck() { const dup = invoices.some((x) => x.id !== cur.id && x.number === cur.number), w = $('numWarn'); w.hidden = !dup; w.textContent = dup ? 'Another saved invoice already uses this number.' : ''; }
  function refresh() { renderPreview(); renderStatus(); numberCheck(); }
  document.addEventListener('input', (e) => { if (!cur || !e.target.closest('#tabNew')) return; if (e.target.id === 'iNum') cur.autoNumber = false; readForm(); refresh(); });
  document.addEventListener('change', (e) => { if (!cur || !e.target.closest('#tabNew')) return; readForm(); refresh(); });
  $('addItem').onclick = () => { readForm(); cur.items.push({ desc: '', pkg: '', qty: '1', price: '' }); renderItems(); refresh(); };

  /* ---------- save / list ---------- */
  function persist(statusIfDraft) {
    readForm(); if (statusIfDraft && cur.status === 'draft') cur.status = statusIfDraft;
    cur.updatedAt = Date.now(); const k = invoices.findIndex((x) => x.id === cur.id);
    if (k >= 0) invoices[k] = JSON.parse(JSON.stringify(cur)); else { invoices.unshift(JSON.parse(JSON.stringify(cur)));
      if (cur.autoNumber && cur.number === pad(settings.next)) { settings.next += 1; write(LS.set, settings); } }
    write(LS.inv, invoices); $('listCount').textContent = invoices.length; renderStatus();
  }
  $('saveDraft').onclick = () => { persist(); say('actMsg', 'Saved on this device as ' + LABEL[effStatus(cur)] + '.', 'ok'); toast('Saved'); };
  $('newInv').onclick = () => { cur = blank(); fillForm(); say('actMsg', ''); say('linkMsg', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  function renderList() {
    $('listCount').textContent = invoices.length; const q = $('q').value.trim().toLowerCase();
    const counts = { all: invoices.length }; invoices.forEach((x) => { const s = effStatus(x); counts[s] = (counts[s] || 0) + 1; });
    $('chips').innerHTML = ['all', 'draft', 'awaiting', 'overdue', 'paid', 'cancelled'].map((s) => `<button type="button" class="chip ${filter === s ? 'on' : ''}" data-f="${s}">${s === 'all' ? 'All' : LABEL[s]} (${counts[s] || 0})</button>`).join('');
    $('chips').querySelectorAll('.chip').forEach((c) => c.onclick = () => { filter = c.dataset.f; renderList(); });
    const list = invoices.filter((x) => (filter === 'all' || effStatus(x) === filter) && (!q || (x.number + ' ' + x.client.name + ' ' + x.client.business).toLowerCase().includes(q)));
    $('listBox').innerHTML = list.length ? list.map((x) => { const s = effStatus(x), tot = C.compute(x).total;
      return `<div class="li" data-id="${esc(x.id)}"><div class="h"><div><strong>${esc(x.number)}</strong> · ${esc(x.client.name) || 'No client name'}<div class="muted small">${esc(C.dateText(x.issue))} · ${esc(C.fmt(tot, x.currency))}</div></div><span class="badge ${s}">${LABEL[s]}</span></div>
      <div class="btns"><button class="btn" data-a="edit">Edit</button><button class="btn" data-a="pdf">PDF</button><button class="btn ghost" data-a="cancel">${x.status === 'cancelled' ? 'Reopen' : 'Cancel'}</button><button class="btn ghost" data-a="del">Delete</button></div></div>`; }).join('') : '<p class="muted">No invoices found.</p>';
    $('listBox').querySelectorAll('.li').forEach((el) => el.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => listAction(el.dataset.id, b.dataset.a)));
  }
  async function listAction(id, a) {
    const x = invoices.find((v) => v.id === id); if (!x) return;
    if (a === 'edit') { cur = JSON.parse(JSON.stringify(x)); fillForm(); tab('new'); window.scrollTo(0, 0); }
    else if (a === 'pdf') { const keep = cur; cur = x; try { await downloadPdf(); } finally { cur = keep; } }
    else if (a === 'cancel') { if (x.status === 'paid') return toast('A paid invoice cannot be cancelled.'); x.status = x.status === 'cancelled' ? 'draft' : 'cancelled'; x.updatedAt = Date.now(); write(LS.inv, invoices); renderList(); }
    else if (a === 'del') { if (confirm('Delete invoice ' + x.number + ' from this device? This cannot be undone.')) { invoices = invoices.filter((v) => v.id !== id); write(LS.inv, invoices); renderList(); } }
  }
  $('q').oninput = renderList;

  /* ---------- PDF / share ---------- */
  async function loadLogo() {
    if (logo) return logo;
    await new Promise((res) => { const im = new Image(); im.onload = () => { logo = im; res(); }; im.onerror = res; im.src = 'images/logo.png'; });
    return logo;
  }
  async function makePdf() {
    if (!cur.items.some((it) => (it.desc || '').trim())) throw new Error('empty');
    await loadLogo(); await ensureFonts();
    const cv = document.createElement('canvas'); window.IVInvoice.draw(cv, invModel(), { width: 1654, dpr: 1, logo });
    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.93)); const jpeg = new Uint8Array(await blob.arrayBuffer());
    const links = window.IVInvoice.draw(document.createElement('canvas'), invModel(), { width: 400, dpr: 1, logo }).links;
    const pdf = P.buildImagePdf(jpeg, cv.width, cv.height, links, { title: `Invoice ${cur.number} - ${cur.client.name || ''}`, author: settings.name || 'Implify Visuals' });
    return new File([pdf], `Implify-Visuals-Invoice-${cur.number.replace(/[^A-Za-z0-9._-]/g, '-')}.pdf`, { type: 'application/pdf' });
  }
  function saveFile(f) { const url = URL.createObjectURL(f), a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 5000); }
  function validate() {
    const c = view().calc; if (!cur.client.name) return 'Enter the client\'s name first.'; if (!cur.items.some((it) => (it.desc || '').trim())) return 'Enter a project or service name.'; if (c.total <= 0) return 'The total is zero. Enter a price.'; return '';
  }
  async function downloadPdf() { const f = await makePdf(); saveFile(f); return f; }
  $('genPdf').onclick = async () => {
    readForm(); const err = validate(); if (err) return say('actMsg', err, 'bad');
    try { const f = await makePdf(); persist('awaiting'); saveFile(f); const hasLink = /^https:\/\/([a-z0-9-]+\.)*paystack\.(com|shop|co)\b/i.test(cur.paymentLink || ''); say('actMsg', hasLink ? `Downloaded ${f.name}. Saved as “${LABEL[effStatus(cur)]}”.` : `Downloaded ${f.name}, but it has NO payment link. Create or paste a Paystack link first, then download again.`, hasLink ? 'ok' : 'warn'); }
    catch (e) { say('actMsg', 'Could not create the PDF. Please try again.', 'bad'); }
  };
  const waText = () => { const t = view(); return `Hello ${cur.client.name || ''}, here is invoice ${cur.number} from ${settings.name} for ${C.fmtPdf(t.calc.total, cur.currency)}${cur.due ? ', due ' + C.dateText(cur.due) : ''}.${cur.paymentLink && cur.status !== 'paid' ? '\nPay securely online: ' + cur.paymentLink : ''}\nThank you.`; };
  const waNumber = () => { let d = (cur.client.phone || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '234' + d.slice(1); return d.length >= 10 ? d : ''; };
  $('sharePdf').onclick = async () => {
    readForm(); const err = validate(); if (err) return say('actMsg', err, 'bad');
    try { const f = await makePdf(); persist('awaiting');
      if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: f.name, text: waText() }); return say('actMsg', 'Shared.', 'ok'); } catch (e) { if (e && e.name === 'AbortError') return; } }
      saveFile(f); say('actMsg', 'Your browser cannot share files directly, so the PDF was downloaded. Attach it in WhatsApp or email.', 'warn'); }
    catch (_) { say('actMsg', 'Could not create the PDF.', 'bad'); }
  };
  $('waBtn').onclick = () => {
    readForm(); const err = validate(); if (err) return say('actMsg', err, 'bad'); persist('awaiting');
    window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent(waText())}`, '_blank', 'noopener');
    say('actMsg', 'WhatsApp opened with the message. Tap “Generate PDF Invoice” first if you also want to attach the PDF.', 'ok');
  };

  /* ---------- Paystack ---------- */
  $('copyLink').onclick = async () => { readForm(); if (!cur.paymentLink) return say('linkMsg', 'There is no payment link yet.', 'bad'); try { await navigator.clipboard.writeText(cur.paymentLink); toast('Link copied'); } catch (_) { $('payLink').select(); toast('Select and copy the link'); } };
  $('makeLink').onclick = async () => {
    readForm(); const v = view(), err = validate(); if (err) return say('linkMsg', err, 'bad');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cur.client.email)) return say('linkMsg', 'Paystack needs the client\'s email address to create a link.', 'bad');
    say('linkMsg', 'Creating Paystack link…'); $('makeLink').disabled = true;
    try { const r = await api('/api/paystack-link', { invoiceNo: cur.number, amount: v.calc.total / 100, currency: cur.currency, email: cur.client.email, clientName: cur.client.name });
      if (r.ok) { cur.paymentLink = r.j.url; cur.paymentRef = r.j.reference; cur.linkAmount = r.j.amount; cur.linkCurrency = r.j.currency; $('payLink').value = cur.paymentLink; persist('awaiting'); refresh(); say('linkMsg', 'Link created. Include it when you send the invoice. The invoice is still “awaiting payment” until Paystack confirms the payment.', 'ok'); }
      else if (r.status === 401) { showLogin('Session expired. Please log in again.'); }
      else say('linkMsg', r.j.error === 'paystack_not_configured' ? 'Paystack is not set up yet (add PAYSTACK_SECRET_KEY in Vercel). You can still paste a link you created manually in Paystack.' : 'Paystack could not create the link' + (r.j.message ? ': ' + r.j.message : '') + '. If you are using USD, USD must be enabled on your Paystack account.', 'bad'); }
    catch (_) { say('linkMsg', 'Network problem. Try again.', 'bad'); }
    $('makeLink').disabled = cur.status === 'paid';
  };
  const REASON = { pending: 'The client has not paid yet.', abandoned: 'The client has not completed payment.', ongoing: 'Payment is still being processed.', failed: 'The payment failed.', not_found: 'Paystack does not know this payment yet.', amount_mismatch: 'A payment was found but the amount does not match the invoice total.', currency_mismatch: 'A payment was found but in a different currency.', invoice_mismatch: 'That payment belongs to a different invoice.' };
  $('checkPay').onclick = async () => {
    readForm(); if (!cur.paymentRef) return say('linkMsg', 'Only links created here can be checked.', 'bad');
    const v = view(); say('linkMsg', 'Asking Paystack…'); $('checkPay').disabled = true;
    try { const r = await api('/api/paystack-check', { reference: cur.paymentRef, amount: v.calc.total / 100, currency: cur.currency, invoiceNo: cur.number });
      if (r.ok && r.j.paid) { cur.status = 'paid'; cur.paidAt = r.j.paid_at || new Date().toISOString(); persist(); refresh(); say('linkMsg', 'Payment confirmed by Paystack. Invoice marked as paid.', 'ok'); }
      else if (r.status === 401) showLogin('Session expired. Please log in again.');
      else say('linkMsg', r.ok ? (REASON[r.j.reason] || 'Not confirmed (' + r.j.reason + ').') : 'Could not check right now. Try again.', r.ok ? 'warn' : 'bad'); }
    catch (_) { say('linkMsg', 'Network problem. Try again.', 'bad'); }
    renderStatus();
  };

  /* ---------- settings ---------- */
  function fillSettings() { $('sName').value = settings.name; $('sEmail').value = settings.email; $('sPhone').value = settings.phone; $('sPay').value = settings.paymentDetails; $('sTerms').value = settings.terms; $('sCur').value = settings.currency; $('sNext').value = settings.next; }
  $('saveSettings').onclick = () => { const n = parseInt($('sNext').value, 10);
    settings = { name: $('sName').value.trim() || 'Implify Visuals', email: $('sEmail').value.trim(), phone: $('sPhone').value.trim(), paymentDetails: $('sPay').value, terms: $('sTerms').value, currency: $('sCur').value, next: Number.isFinite(n) && n > 0 ? n : settings.next };
    if (write(LS.set, settings)) { say('setMsg', 'Saved.', 'ok'); if (cur) refresh(); } };
  $('expBtn').onclick = () => { saveFile(new File([JSON.stringify({ settings, invoices }, null, 1)], 'implify-invoices-backup.json', { type: 'application/json' })); };
  $('impFile').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.invoices)) throw 0;
    const have = new Set(invoices.map((x) => x.id)); d.invoices.forEach((x) => { if (x && x.id && !have.has(x.id)) invoices.push(x); }); write(LS.inv, invoices); renderList(); toast('Backup imported'); } catch (_) { toast('That file is not a valid backup.'); } e.target.value = ''; };

  /* ---------- tabs ---------- */
  function tab(t) { document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    $('tabNew').hidden = t !== 'new'; $('tabList').hidden = t !== 'list'; $('tabSettings').hidden = t !== 'settings'; if (t === 'list') renderList(); if (t === 'settings') fillSettings(); if (t === 'new' && cur) setTimeout(() => refresh(), 0); }
  document.querySelectorAll('.tab').forEach((b) => b.onclick = () => tab(b.dataset.tab));

  let started = false;
  function init() { if (started) return; started = true; invoices = read(LS.inv, []); cur = blank(); fillForm(); $('listCount').textContent = invoices.length; loadLogo().then(() => drawPreview()); }
  window.addEventListener('pageshow', () => {});
  boot();
})();

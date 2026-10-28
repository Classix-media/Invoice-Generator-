# Implify Visuals Invoice Generator (standalone site)

Separate from the main Implify Visuals website. Nothing here touches its bookings, checkout, Paystack verification, Supabase or Make.

## Vercel settings (Project > Settings > Environment Variables)
| Name | Required | What it is |
|---|---|---|
| INVOICE_PASSWORD | yes | The password you type to open the site. |
| INVOICE_SESSION_SECRET | yes | Any long random text (40+ characters). Used to sign your login. |
| PAYSTACK_SECRET_KEY | only for "Create Paystack link" / "Check payment" | Your Paystack secret key (sk_live_...). Never put it in code or chat. |

## Where invoices are stored
Only in this phone's/browser's own storage (localStorage). Nothing is sent to a server except when you create a Paystack link or check a payment. Use Settings > Export backup regularly. They do not sync between devices.

## Files
index.html, style.css, app.js, calc.js, invoice-render.js, pdf.js, images/logo.png, images/favicon.png, vercel.json, robots.txt, package.json
api/login.js, logout.js, session.js, paystack-link.js, paystack-check.js, api/_lib/auth.js

## v2 notes
- Original blue theme with light and dark mode kept; only the layout/structure was reorganised (numbered sections, tidy mobile stacking).
- invoice-render.js draws the invoice exactly like the one on the main Implify Visuals website (same design, Inter Tight + Impact/Anton title). The live preview and the PDF both use it, so they are identical and always one A4 page.
- The PDF is the rendered page as a high-resolution image (about 200 dpi); the Paystack link stays clickable. Text in the PDF is not selectable.
- Logo and favicon are the transparent cobalt-gradient logo from the main site.

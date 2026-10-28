# Implify Visuals Invoice Generator (standalone site)

Separate from the main Implify Visuals website. Nothing here touches its bookings, checkout, Paystack verification, Supabase or Make.

## Vercel settings (Project > Settings > Environment Variables)
| Name | Required | What it is |
|---|---|---|
| INVOICE_PASSWORD | yes | The password you type to open the site. |
| INVOICE_SESSION_SECRET | yes | Any long random text (40+ characters). Used to sign your login. |
| PAYSTACK_SECRET_KEY | only for "Create a Paystack link" / "Check payment" | Your Paystack secret key (sk_live_...). Never put it in code or chat. |

## Where invoices are stored
Only in this phone's/browser's own storage (localStorage). Nothing is sent to a server except when you create a Paystack link or check a payment. Use Settings > Export backup regularly. They do not sync between devices.

## Files
index.html, style.css, app.js, calc.js, pdf.js, images/logo.jpg, images/favicon.png, vercel.json, robots.txt, package.json
api/login.js, logout.js, session.js, paystack-link.js, paystack-check.js, api/_lib/auth.js

# Kanaklata Heights Puja Receipts

A mobile-first Progressive Web App for generating and retaining Durga Puja donation receipts.

## What it does

- Generates sequential receipt numbers such as `KH-2026-0001`.
- Stores receipt records, amount totals, and committee details locally on the device.
- Creates a polished digital receipt with Kanaklata Heights / Sharodotsav branding.
- Shares a receipt image through the phone share sheet (select WhatsApp) and opens WhatsApp with a recipient-ready message/link.
- Opens the native SMS composer with the same message.
- Uses the device share sheet where supported, and supports printing/saving as PDF.
- Works offline after its first visit and can be installed from a mobile browser's **Add to Home screen** option.

## Use it

1. Put these files on any static web host (Netlify, GitHub Pages, Cloudflare Pages, or your society website).
2. Open the published URL on Android or iPhone and choose **Add to Home screen**.
3. Use the gear icon to set the collection year, collector, and secretary before generating receipts.

> The receipt register is intentionally browser-local: the cashier's phone is the single source of records. Use **Back up records** after collection sessions and keep the downloaded file in the phone's Files or Google Drive at no cost.

## Important sharing note

The WhatsApp/SMS link embeds a read-only copy of that receipt, so a recipient can open it on any phone after the app is placed on a free static host. No donor database is exposed and no paid backend is needed.

## Suggested production upgrades

- Optional PIN lock for the cashier phone
- Downloadable Excel export
- Payment gateway / UPI reconciliation
- Duplicate-payment and receipt-number protection

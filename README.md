# CAUMAS Event Platform

**WHERE LEARNING NEVER ENDS,**

Sustainable, reliable event operations for service organizations — volunteer roster, QR passes, on-site scanners, meal tracking, activity passes, and public verification.

**Full setup:** see [SETUP.md](./SETUP.md)

```bash
npm install
npm run dev
```

| Item | Value |
|------|--------|
| Login | `caumas` / `Event@1234` (override via `.env`) |
| Roster | `src/data/example.json` |
| Logo | `public/caumas-logo.png` |

**After adding volunteers:** save JSON → dev auto-generates QRs → see [DATA-RELOAD.md](./DATA-RELOAD.md)

## Features

- **Dashboard** — live stats: volunteers, entry, kits, meals
- **Volunteers** — QR passes, checkboxes, bulk PDF, EmailJS
- **Scanners** — entry QR scanner + daily meal scanner
- **Activities** — adventure, cultural, workshop passes
- **Public verify** — `/verify/:id` (no login)
- **Firebase** (optional) — sync status across devices
- **Branding** — CAUMAS logo colors (navy, teal, sky, gold)

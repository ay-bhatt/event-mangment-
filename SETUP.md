# CAUMAS Event Platform

Local-first event admin panel. **Edit only** `src/data/example.json` to change volunteers — the app reloads automatically in dev.

## Quick start

```bash
cd "qr verifier"
npm install
npm run dev
```

QR codes and IDs for **every** row in `example.json` are generated automatically when dev starts and whenever you save that file. See **[DATA-RELOAD.md](./DATA-RELOAD.md)** for reload steps.

Open http://localhost:5173

| Route | Description |
|-------|-------------|
| `/login` | Admin login |
| `/dashboard` | Event overview and quick actions |
| `/volunteers` | Volunteer cards, QR, checkboxes, bulk PDF |
| `/scanner` | Camera QR scanner + manual ID lookup |
| `/check/:id` | Volunteer detail after scan (VALID / NOT VALID) |
| `/settings` | Event name, QR prefix, email template |
| `/verify/:id` | Public pass verification (no login) |

**Default login:** `caumas` / `Event@1234`

---

## 1. Edit volunteers (single source of truth)

`src/data/example.json`:

```json
[
  {
    "name": "Ayush Bhatt",
    "email": "ayush@gmail.com",
    "phone": "9876543210",
    "team": "Technical",
    "role": "Volunteer"
  }
]
```

- IDs are **not** stored in `example.json`. They are auto-assigned as `JATRA-VOL-001`, `JATRA-VOL-002`, … in `src/data/id-registry.json`.
- IDs are **stable**: deleting a later volunteer does not renumber earlier IDs.
- After editing JSON: save the file → dev auto-generates QRs → browser reloads. Details in **DATA-RELOAD.md**.

---

## 2. Firebase (optional — checkbox persistence)

1. Go to https://console.firebase.google.com → **Create project**
2. **Build → Firestore Database → Create database** (test mode is fine for demos; lock rules before production)
3. **Project settings → Your apps → Web** → register app → copy config
4. Copy `.env.example` to `.env` and fill:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Firestore collection: `volunteer_status` — document ID = volunteer ID (e.g. `JATRA-VOL-001`), fields = checkbox keys.

Without Firebase, checkboxes save to **localStorage** only (per browser).

---

## 3. EmailJS (optional — send QR pass)

1. https://www.emailjs.com → sign up
2. **Email Services** → add service (Gmail, etc.)
3. **Email Templates** → create template with variables, e.g.:

| Variable | Use |
|----------|-----|
| `{{to_email}}` | Recipient |
| `{{to_name}}` | Volunteer name |
| `{{volunteer_id}}` | ID |
| `{{event_name}}` | Event |
| `{{subject}}` | Subject line |
| `{{message}}` | Body text |
| `{{qr_image}}` | Base64 QR (attach or embed per EmailJS docs) |

4. **Account → API keys** → Public Key
5. Add to `.env`:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
```

6. Restart `npm run dev`. Use **Email** on a volunteer card.

---

## 4. Environment variables (summary)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_FIREBASE_*` | No | Firestore checkbox sync |
| `VITE_EMAILJS_*` | No | Send volunteer pass |
| `VITE_APP_BASE_URL` | No | QR verify URL base (default: current origin) |

---

## 5. QR behaviour

- Each volunteer gets a **unique** QR encoding: `https://your-host/verify/JATRA-VOL-001`
- QR never contains email or phone
- In-browser preview uses `react-qr-code` (unique `key` per card)
- PNG files: `npm run generate-qrs` → `src/generatedQRCodes/JATRA-VOL-001.png`

---

## 6. Testing checklist

1. **Login** — `caumas` / `Event@1234` → redirects to Volunteers
2. **Volunteers** — 5 cards, each with different QR; toggle checkboxes; refresh — state persists (local or Firestore)
3. **PNG** — download per card
4. **Bulk PDF** — select 2+ → Bulk PDF
5. **Scanner** — Start Camera → scan QR → redirects to `/check/JATRA-VOL-001` with full details
6. **Manual lookup** — enter `001` or `JATRA-VOL-001` → Look up volunteer
7. **Invalid** — `/check/FAKE-999` → red NOT VALID
8. **Verify** — open `/verify/JATRA-VOL-001` in incognito → green VALID PASS
9. **Settings** — change event name → Save → emails/PDF use new name
10. **JSON** — add 6th volunteer to `example.json`, restart dev → new `JATRA-VOL-006`

---

## 7. Build for production

```bash
npm run build
npm run preview
```

Deploy `dist/` to Cloudflare Pages, Netlify, or any static host. Set `VITE_APP_BASE_URL` to your production URL before build so QR links work.

---

## Project structure

```
src/
  data/example.json          ← edit volunteers here
  generatedQRCodes/          ← PNG output (npm run generate-qrs)
  firebase.ts
  components/
    AppSidebar.tsx
    MobileNav.tsx
    VolunteerCard.tsx
    IntegrationBanner.tsx
    ui/                      ← ShadCN primitives
  lib/
    volunteers.ts            ← JSON load + stable IDs
    qr-utils.ts
    status.ts
    settings.ts
    emailService.ts
    auth.tsx
  routes/
    login.tsx
    verify.$id.tsx
    _authenticated/
      volunteers.tsx
      scanner.tsx
      settings.tsx
scripts/generate-qrs.ts
SETUP.md
```

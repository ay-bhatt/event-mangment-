# Loading new volunteers from `example.json`

## What you edit

Only **`src/data/example.json`** — add, remove, or change volunteers there.

Do **not** hand-edit `src/data/id-registry.json` or files in `src/generatedQRCodes/` — those are updated automatically.

---

## Steps after adding or changing volunteers

### While developing (`npm run dev`)

1. Save `src/data/example.json`
2. Wait a few seconds — the dev server auto-runs QR generation
3. The browser will **reload** when done
4. Open **Volunteers** — every entry should have its own QR and ID (`JATRA-VOL-001`, …)

If the page does not reload, press **F5** or restart dev:

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

### One-time / production build

```bash
npm run generate-qrs   # assigns IDs + creates PNGs for ALL entries
npm run build          # includes generate-qrs automatically
npm run preview
```

---

## What gets generated automatically

| Output | Location | Purpose |
|--------|----------|---------|
| Stable IDs | `src/data/id-registry.json` | `JATRA-VOL-001`, `JATRA-VOL-002`, … (never reshuffled) |
| QR PNG files | `src/generatedQRCodes/JATRA-VOL-001.png` | Download / email attachments |
| On-screen QR | Volunteers page | Rendered live for every JSON entry |

New volunteers in JSON → new ID (next number) → new PNG → new card on site.

Removed volunteers → their PNG is deleted; old IDs are **not** reused.

---

## Example: add a 6th volunteer

Add to `example.json`:

```json
{
  "name": "New Person",
  "email": "new@email.com",
  "phone": "9999999999",
  "team": "Technical",
  "role": "Volunteer"
}
```

Save → dev auto-generates `JATRA-VOL-006.png` → refresh → card appears.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| New person not showing | Save JSON, wait for terminal `Done: N volunteer(s)`, press F5 |
| Wrong/old QR | Run `npm run generate-qrs`, refresh browser |
| Invalid JSON | Each entry needs a **comma** after `}` except the last one. Example: after Arjun's `}` add `,` before the next `{` |
| Changed QR prefix in Settings | Run `npm run generate-qrs` again, restart dev |

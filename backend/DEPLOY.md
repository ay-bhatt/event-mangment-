# Caumas Event Manager — cPanel Deployment

## Overview

| Layer | Stack |
|-------|--------|
| Frontend | React + Vite → static files in `public_html` |
| Backend | Node.js + Express in `backend/` |
| Database | MySQL via cPanel |

## 1. MySQL Setup

1. cPanel → **MySQL Databases** → create database `caumas_events`
2. Create a MySQL user with ALL PRIVILEGES on that database
3. phpMyAdmin → Import `backend/database/schema.sql`
4. Note host (usually `localhost`), user, password, database name

## 2. Backend Setup

1. Upload `backend/` folder to your hosting (e.g. `~/caumas-api/`)
2. SSH or cPanel Terminal:

```bash
cd ~/caumas-api
cp .env.example .env
# Edit .env with your MySQL credentials and JWT_SECRET
npm install --production
npm run seed
```

3. cPanel → **Setup Node.js App**:
   - Node version: 18+
   - Application root: `caumas-api`
   - Application URL: `api.yourdomain.com` (or subdirectory)
   - Application startup file: `app.js`
   - Add environment variables from `.env`

4. Start / restart the Node.js application

## 3. Frontend Build

On your dev machine:

```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_BASE_URL=https://yourdomain.com

npm run build
```

Upload contents of `dist/` to `public_html/`.

For SPA routing, add to `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 4. CORS

In `backend/.env`, set:

```
CORS_ORIGIN=https://yourdomain.com
```

## 5. Default Login Accounts

After `npm run seed`:

| Username | Password | Role |
|----------|----------|------|
| jatra 2026 | jatrafestival@2026 | super_admin |
| caumas | Caumas@Admin2026 | event_admin |
| gateadmin | Gate@Scan2026 | scanner |

## 6. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/validate` | Validate session |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/dashboard/stats` | Dashboard analytics |
| GET/PUT | `/api/dashboard/status/:passId` | Pass status |
| POST | `/api/scans/validate` | Log QR scan |
| POST | `/api/attendance/check-in` | Record attendance |
| POST | `/api/meals/collect` | Collect meal |
| GET | `/api/meals/logs` | Meal history |

## 7. JSON Files (unchanged)

QR generation still uses:
- `src/data/example.json`
- `src/data/activity.json`, `cultural.json`, `workshop.json`
- `src/data/id-registry.json`

Run `npm run generate-qrs` before build to regenerate PNGs.

## 8. Health Check

`GET https://api.yourdomain.com/health` → `{ "success": true, "status": "ok" }`

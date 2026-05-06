# Deployment — Cloudways

This project deploys as **two separate Cloudways applications** on a single server (recommended) or two servers:

1. **Backend API** — PHP 8.2 stack, MySQL.
2. **Frontend SPA** — same PHP 8.2 stack (Apache static hosting + .htaccess) or any static host.

Suggested DNS:
- `api.example.com` → backend
- `example.com` / `www.example.com` → frontend

---

## 1. Backend on Cloudways

### Create the application

1. Cloudways Console → **Applications → Add Application**
2. Stack: **PHP 8.2**, MySQL bawaan.
3. Name it e.g. `portfolio-api`, attach domain `api.example.com`.

### Upload code

Cloudways application root layout looks like this:
```
applications/<app-name>/public_html/   <-- web-accessible (this becomes "/")
applications/<app-name>/private_html/  <-- not web-accessible
```

You have two options for `backend/`:

**Option A — keep the project root above public_html (recommended)**

Upload the whole `backend/` folder to `applications/portfolio-api/private_html/` (or any path above `public_html`), then in Cloudways **Application Settings → Application & Folder Settings**, set **Webroot** to `private_html/backend/public` (or wherever you placed the `public/` folder).

This way `.env`, `vendor/`, `migrations/` are NOT web-accessible.

**Option B — put `public/` contents into public_html**

Move everything inside `backend/public/` into `applications/portfolio-api/public_html/`, and place `src/`, `vendor/`, `config/`, `.env` etc. in `private_html/`. Edit `public_html/index.php` so the require paths point to `../private_html/...`.

Option A is cleaner — use it.

### Composer

SSH into the server (Cloudways → **Server Management → Master Credentials**, or use the SSH terminal in console):

```bash
cd applications/<app-name>/private_html/backend
composer install --no-dev --optimize-autoloader
```

### Environment

```bash
cp .env.example .env
nano .env
```

Set:
- `APP_URL=https://api.example.com`
- `FRONTEND_ORIGIN=https://example.com` (CORS)
- DB credentials (Cloudways shows them under **Application → Access Details**)
- `JWT_SECRET=<long random string>` — generate with `openssl rand -hex 32`
- Elastic Email SMTP creds + `CONTACT_RECIPIENT`

Permissions:
```bash
chmod 644 .env
chmod -R 775 public/uploads
```

### Database

Cloudways auto-creates a database for the app. Get its name/user/pass from **Access Details** and put them in `.env`. Then run migrations + seed:

```bash
cd applications/<app-name>/private_html/backend
php migrations/migrate.php
php migrations/seed.php admin@example.com strongPassword "Admin Name"
```

### SSL

Cloudways → **Application → SSL Certificate** → Let's Encrypt → enter `api.example.com` and your email → install. Force HTTPS.

### Sanity check

- `https://api.example.com/api/health` → `{"ok":true,"data":{"status":"ok"}}`
- `https://api.example.com/api/public/categories` → `[]` (empty until you add data)

---

## 2. Frontend on Cloudways

### Create the application

1. Add another application: **PHP 8.2** stack (you'll only use it for static hosting + Apache rewrite).
2. Name it e.g. `portfolio-web`, attach domain `example.com`.

### Build locally and upload

On your computer:

```bash
cd frontend
cp .env.example .env
# edit .env:
# VITE_API_URL=https://api.example.com/api
# VITE_MEDIA_URL=https://api.example.com
npm install
npm run build
```

Upload everything inside `frontend/dist/` to `applications/portfolio-web/public_html/`. The `dist/.htaccess` (auto-copied from `public/.htaccess`) handles SPA fallback.

### SSL

Same procedure — Let's Encrypt for `example.com` and `www.example.com`. Force HTTPS.

### Sanity check

- `https://example.com` loads the SPA.
- Refresh on a deep route (e.g. `/products/foo/bar`) → still loads (proves `.htaccess` fallback works).
- Open browser console → no CORS errors → confirms backend `FRONTEND_ORIGIN` is correct.

---

## 3. Post-deploy checklist

- [ ] Login at `https://example.com/admin/login` with seeded admin.
- [ ] **Site Settings**: fill in site name, contact details, social links, GA4 ID.
- [ ] **Homepage Banners**: upload at least one banner.
- [ ] Create 1 Category → 1 Sub-category → 1 Product (test the full hierarchy).
- [ ] Create 1 Project + 1 Publication.
- [ ] Add a few items to **Download Center**.
- [ ] Edit **Service Page** content.
- [ ] Submit a **Contact Form** test → confirm Elastic Email delivers it to `CONTACT_RECIPIENT`.
- [ ] Open GA4 Realtime → confirm events arriving as you browse.

---

## Updating later

**Backend code change:**
```bash
cd applications/<app-name>/private_html/backend
git pull   # if you set up git
composer install --no-dev --optimize-autoloader
# if migrations changed:
php migrations/migrate.php
```

**Frontend code change:**
```bash
cd frontend
npm run build
# upload dist/ contents over public_html
```

**Add a new admin user** (admin only): use **Admin → Users** in the CMS UI.

---

## Backups

Cloudways takes daily snapshots of the entire server. For DB-only backup:

```bash
cd applications/<app-name>
mysqldump -u <user> -p<pass> <dbname> > backup-$(date +%F).sql
```

The `public/uploads/` folder also needs to be backed up — it's where images and downloadable files live.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `404` on every API endpoint | Webroot not pointing to `backend/public`, or `.htaccess` not enabled |
| CORS error in browser | `FRONTEND_ORIGIN` in backend `.env` doesn't match the frontend domain |
| Refresh on `/products/foo` returns 404 | Frontend `.htaccess` missing or Apache `mod_rewrite` disabled |
| Upload returns 500 | `public/uploads/` not writable — `chmod -R 775 public/uploads` |
| Contact form silently fails | Wrong SMTP creds / port 2525 blocked — check `error_log` |
| Login returns 401 with correct creds | JWT_SECRET changed after seeding — clear browser localStorage |
| Bcrypt error on PHP older than 8.1 | Upgrade to PHP 8.1+ in Cloudways stack |

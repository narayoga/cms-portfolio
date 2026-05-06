# Backend — Portfolio CMS

Vanilla PHP 8.1+ REST API + MySQL. No framework.

## Setup (local)

1. Install PHP 8.1+, MySQL, Composer.
2. `cd backend && composer install`
3. Create database, e.g. `CREATE DATABASE portfolio_cms CHARACTER SET utf8mb4;`
4. `cp .env.example .env` and edit DB + SMTP credentials.
5. Run migrations: `php migrations/migrate.php`
6. Seed admin: `php migrations/seed.php admin@example.com yourpassword "Your Name"`
7. Start dev server: `php -S localhost:8000 -t public`

API base: `http://localhost:8000/api`. Health: `GET /api/health`.

## Endpoints

- `POST /api/auth/login` → `{ email, password }` returns `{ token, user }`
- `GET  /api/auth/me` (Bearer) — current user
- Public read: `/api/public/...` (see `public/index.php`)
- Admin CRUD: `/api/admin/...` (Bearer required; users requires admin role)
- File upload: `POST /api/admin/upload?kind=image|file` (multipart `file`) returns `{ path }`
- Contact: `POST /api/public/contact` → sends email via Elastic SMTP

## File uploads

Stored under `public/uploads/YYYY/MM/<random>.<ext>`. Path saved in DB is relative (e.g. `/uploads/2026/05/abcd.jpg`). Frontend prefixes the API host.

## Cloudways notes

- Document root must be `backend/public`.
- Upload `backend/` to Application's root (above `public_html`), then point public html / webroot to `public/`. Or set Application's "Web Application Folder" to `public`.
- Place `.env` at `backend/.env` (above public root).
- `public/uploads` must be writable (chmod 775, owner = web user).
- In Cloudways Application Settings, set the application stack to PHP 8.1+.
- Set `FRONTEND_ORIGIN` in `.env` to your frontend domain for CORS.

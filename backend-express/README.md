# Portfolio CMS — Backend (Express + TypeScript)

REST API for the website and the admin panel. Replaces the old PHP backend in
`../backend` (kept only as a fallback; run it with the `backend-php-legacy`
launch config on port 8002).

## Setup

1. All secrets live in **one file: `../.env`** (the repository root).
   Copy `../.env.example` to `../.env` and fill in the values.
2. Install and start:

```bash
npm install
npm run dev        # http://localhost:8000 (restarts on every file change)
```

## Folder structure

```
src/
  server.ts            starts the server
  app.ts               express setup: cors, json, /uploads, routes, error handler
  routes.ts            EVERY route in one file
  config/env.ts        reads ../.env
  lib/                 db, response, auth, validator, values, upload, mailer
  controllers/         one file per resource
  types/database.ts    the shape of each table row
public/uploads/        uploaded files (served at /uploads/...)
migrations/            database structure (.sql files)
scripts/               db and maintenance scripts
```

## Uploads

Every admin form uploads into its own folder:
`POST /api/admin/upload?kind=image&folder=projects` → `/uploads/projects/park-hyatt-k3f9a2.jpg`.
The allowed folders are listed in `ALLOWED_UPLOAD_FOLDERS` in `src/lib/upload.ts`.
JPEG/PNG images are resized to max 1600px and compressed automatically.

| Folder | Used by |
|---|---|
| `site/logo`, `site/home`, `site/mega-menu`, `site/services`, `site/download-center` | general website images |
| `banners` | Admin › Homepage Banners |
| `brands` | brand logos |
| `catalog/categories`, `catalog/subcategories`, `catalog/items`, `catalog/features` | product catalog |
| `products`, `projects`, `publications` | their admin pages |
| `downloads/thumbnails`, `downloads/files` | Admin › Downloads |
| `story` | homepage story milestones |
| `content` | images inside articles (rich text editor) |

Replacing an image in the admin does **not** delete the old file (a file can be
used in more than one place). `uploads-unused/` holds files that nothing uses.

## Database scripts

| Command | What it does |
|---|---|
| `npm run db:migrate` | Runs new `.sql` files from `migrations/` (remembered in `schema_migrations`) |
| `npm run db:create-admin -- <email> <password> [name]` | Creates (or resets) an admin user |
| `npm run db:export` | Saves all content to `backups/data-<time>.sql` |
| `npm run db:import -- <file.sql>` | Runs a `.sql` file (⚠ an export file **replaces** all rows) |

### Moving to a new database

1. Export the old one: `npm run db:export`
2. Put the new database credentials in `../.env`
3. Create the tables: `npm run db:migrate`
4. Copy the content: `npm run db:import -- backups/data-<time>.sql`
   (or skip this and run `npm run db:create-admin -- ...` for an empty site)
5. Copy `public/uploads/` to the new server as well — the database only stores paths.

To change the structure later, add a new file such as `migrations/001_add_video_url.sql`
and run `npm run db:migrate`.

## Other scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript check |
| `npm run compare-api` / `npm run compare-writes` | Parity tests against the old PHP backend (`PHP_URL`, `EXPRESS_URL`) |
| `npm run uploads:reorganize` | One-time uploads reorganization (already done on 2026-10-08; restore file in `backups/`) |

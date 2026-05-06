# Frontend — Portfolio CMS

React (Vite) SPA. Custom CSS, no UI framework.

## Setup (local)

1. Install Node.js 18+.
2. `cd frontend && npm install`
3. `cp .env.example .env` and edit:
   - `VITE_API_URL` — base URL of backend, e.g. `http://localhost:8000/api`
   - `VITE_MEDIA_URL` — base URL where uploaded files are served, e.g. `http://localhost:8000`
4. `npm run dev` — opens at http://localhost:5173

## Build

```
npm run build
```

Output: `dist/`. The `public/.htaccess` is copied automatically — required for SPA routing on Apache (Cloudways).

## Routes

Public:
- `/`, `/services`, `/download-center`, `/contact`
- `/products`, `/products/:cat`, `/products/:cat/:sub`, `/products/:cat/:sub/:product`
- `/projects`, `/projects/:slug`
- `/publications`, `/publications/:slug`

Admin (requires login):
- `/admin/login`, `/admin`
- `/admin/categories`, `/admin/subcategories`, `/admin/products`
- `/admin/projects`, `/admin/publications`, `/admin/downloads`
- `/admin/banners`, `/admin/service`, `/admin/settings`
- `/admin/users` (admin role only)

## Google Analytics

Set the GA4 Measurement ID in **Admin → Site Settings**. The frontend reads it from the public settings endpoint and injects gtag.js automatically. No rebuild needed.

## Architecture notes

- Auth token stored in `localStorage` (`cms_token`).
- `api/client.js` — single fetch wrapper, attaches Bearer token, normalizes responses.
- `mediaUrl(path)` resolves relative `/uploads/...` paths against `VITE_MEDIA_URL`.
- `RichText.jsx` sanitizes HTML via DOMPurify before rendering.
- `RichTextEditor.jsx` is a contentEditable wrapper using `document.execCommand` — minimal, no third-party editor.

# leak.bin

Anonymous pastebin-style full-stack app with security-focused admin controls.

## Stack

- Frontend: React + TanStack Router + Tailwind CSS
- Backend: Node.js + Express API routes
- Database: SQLite (`better-sqlite3`)

## Features

- Create text/code pastes with unique URLs
- Expiration options: `1h`, `1d`, `7d`, `never`
- Syntax highlighting + copy button
- Username + tag system (`admin`, `mod`, `user`, custom tags)
- Public/unlisted visibility and burn-after-read support
- Editable TOS page stored in DB
- Hidden admin panel shortcut: `Shift + J`, then `Shift + K`
- Admin-protected server routes with `ADMIN_KEY` validation
- Rate limiting for paste creation

## Run

1. Copy `.env.example` to `.env`
2. Set a strong `ADMIN_KEY`
3. Install dependencies: `npm install`
4. Start both client and server: `npm run dev`

API server runs on `http://localhost:3001` and Vite proxies `/api`.

## Fastest Hosting (Railway)

1. Push this folder to GitHub.
2. Create a new Railway project from that repo.
3. Set environment variables:
   - `ADMIN_KEY` = your secret admin key
   - `NODE_ENV` = `production`
   - `DATA_DIR` = `/data` (if using a Railway volume)
4. Add a Railway volume and mount it to `/data` to persist SQLite.
5. Deploy.

Railway will run `npm start`, and the backend serves the built frontend from `dist` in production.

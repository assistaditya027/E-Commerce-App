# Clovo E‑Commerce App

Full‑stack e‑commerce project with a customer storefront, admin dashboard, and Node/Express backend.

**Apps**
1. `Frontend` – customer web app
2. `admin` – admin dashboard
3. `Backend` – API server

**Tech stack**
1. React + Vite (Frontend + Admin)
2. Node.js + Express (Backend)
3. MongoDB + Mongoose

**Quick start (local)**
1. Backend
```bash
cd Backend
npm install
npm run server
```
2. Frontend
```bash
cd Frontend
npm install
npm run dev
```
3. Admin
```bash
cd admin
npm install
npm run dev
```

**Environment variables**
1. Backend: create `Backend/.env` (see existing keys in the file)
2. Frontend: create `Frontend/.env`
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_DELIVERY_FEE=10
```
3. Admin: create `admin/.env`
```env
VITE_BACKEND_URL=http://localhost:8000
```

**OAuth setup (Google + GitHub)**
1. Set these in `Backend/.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=http://localhost:8000/api/user/oauth/google/callback`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL=http://localhost:8000/api/user/oauth/github/callback`
2. In Google/GitHub developer console, add the exact callback URLs above.
3. Frontend OAuth returns to `/oauth/callback` and stores the JWT.

**Ports (default)**
1. Backend: `http://localhost:8000`
2. Frontend: `http://localhost:5173`
3. Admin: `http://localhost:5174`

**Project structure**
1. `Backend/config` – database, cloud, and OAuth config
2. `Backend/routes` – API routes
3. `Frontend/src/pages` – customer screens
4. `admin/src/pages` – admin screens

**Security note**
Do not commit real secrets to GitHub. Use `.env` files locally and environment variables in production.

If you want a production deployment guide, tell me your hosting target and I’ll add it.

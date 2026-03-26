# Clovo Admin Dashboard

This is the admin panel for the Clovo E‑Commerce app. It’s a React + Vite app used to manage products, orders, and site content through the backend API.

**What’s inside**

1. Admin login
2. Product management (add/update/list)
3. Order management and status updates
4. Basic media uploads

**Tech stack**

1. React + Vite
2. React Router
3. Axios
4. Tailwind CSS

**Prerequisites**

1. Node.js 18+ (recommended)
2. Backend server running (see `Backend` folder)

**Environment variables**
Create a `.env` file in `admin`:

```env
VITE_BACKEND_URL=http://localhost:8000
```

**Install**

```bash
cd admin
npm install
```

**Run (dev)**

```bash
npm run dev
```

**Build**

```bash
npm run build
```

**Preview build**

```bash
npm run preview
```

**Admin auth**

1. Admin login uses backend `/api/user/admin/login`.
2. Ensure backend `.env` includes:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

**Common issues**

1. “Backend URL is not configured”
   - Set `VITE_BACKEND_URL` in `admin/.env`
2. 401 Unauthorized
   - Verify admin credentials in `Backend/.env`

**Project structure**

1. `src/pages` – dashboard screens
2. `src/components` – reusable UI
3. `src/context` – app state and API helpers

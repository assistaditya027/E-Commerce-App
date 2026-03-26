# Clovo Frontend

This is the customer-facing frontend for the Clovo E‑Commerce app. It’s a React + Vite app that talks to the backend API for auth, products, cart, and orders.

**What’s inside**

1. Product browsing and collections
2. Cart and checkout flow
3. User auth with email/password and OAuth
4. Profile and order history

**Tech stack**

1. React + Vite
2. React Router
3. Axios
4. Tailwind CSS

**Prerequisites**

1. Node.js 18+ (recommended)
2. Backend server running (see `Backend` folder)

**Environment variables**
Create a `.env` file in `Frontend`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_DELIVERY_FEE=10
```

**Install**

```bash
cd Frontend
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

**Auth and OAuth notes**

1. Email/password auth uses the backend endpoints under `/api/user`.
2. OAuth redirects to `/oauth/callback` in the frontend, which stores the JWT token and sends the user back to the original page.
3. Make sure backend `.env` has:
   - `FRONTEND_URL=http://localhost:5173`
   - OAuth client IDs and callback URLs for Google and GitHub

**Common issues**

1. “Backend URL is not configured”
   - Set `VITE_BACKEND_URL` in `Frontend/.env`
2. OAuth did not return email (GitHub)
   - Make your GitHub email public or set a public email in GitHub profile

**Project structure**

1. `src/pages` – screens (Login, Profile, Orders, etc.)
2. `src/components` – reusable UI pieces
3. `src/context` – app state and API helpers

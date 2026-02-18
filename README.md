# letterbox-fullstack

Fullstack reimagination of Letterboxd for movie and series discovery, rating, and social features.

## Planned Features
- Swipe-style movie discovery
- Movie Wrapped recap
- Movies + series with streaming availability
- Ratings and comments
- Search
- Watchlists
- Recommendation layer

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: FastAPI
- Database: PostgreSQL via Supabase
- External API: TMDB
- Deployment: Vercel (frontend), Railway/Render (backend)

## Project Structure
- `frontend/` Next.js app
- `backend/` FastAPI API

## Local Setup

### 1) Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Required env variables in `backend/.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `FRONTEND_ORIGIN` (e.g. `http://localhost:3000`)

Run API:
```bash
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Optional env in `frontend/.env.local`:
- `BACKEND_API_URL=http://127.0.0.1:8000`

The frontend now proxies auth calls via Next.js route handlers (`/api/auth/*`),
so browser-side CORS issues are minimized during local development.

## Auth Starter (Industry-Style Learning Baseline)
- `POST /auth/register` → creates Supabase auth user
- `POST /auth/login` → returns bearer access token + refresh token
- `GET /auth/me` → returns current user from bearer token

Frontend home page now includes a minimal Register/Login/Profile flow to learn end-to-end auth.

## Baseline Commit Checklist
- Ensure `backend/.env` is **not** tracked
- Ensure `frontend/.next` is **not** tracked
- Run `npm run lint` in `frontend/`
- Start backend once with `uvicorn app.main:app --reload`

Then:
```bash
git add .
git status
git commit -m "chore: clean fullstack project baseline"
```
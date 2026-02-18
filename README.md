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
- Sign up questions (age, fav genre, real/sci fi, character vs spannung)

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
- `TMDB_API_KEY` ([Get API key from TMDB](https://www.themoviedb.org/settings/api))

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

## Movies Discovery API
- `GET /movies?page=1` → fetch popular movies from TMDB
- `GET /movies/search?q=...` → search movies by title
- `POST /movies/ratings` → rate a movie (requires auth)
- `GET /movies/ratings/me` → get current user's ratings (requires auth)

**Setup:**
1. Get a free TMDB API key at https://www.themoviedb.org/settings/api
2. Add `TMDB_API_KEY=<your_key>` to `backend/.env`
3. Run the SQL setup in `backend/supabase_setup.sql` in your Supabase SQL Editor to create tables
4. Frontend: register/login, then click "Discover Movies" to start rating

Frontend includes a swipe-style movie discovery component with:
- Popular movie feed from TMDB
- Quick-rating buttons (1, 3, 5, 7, 10 stars)
- Persistent ratings via Supabase
- Back/Skip navigation

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
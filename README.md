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
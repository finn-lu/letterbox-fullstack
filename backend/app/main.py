import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import supabase
from app.routes.auth import router as auth_router
from app.routes.movies import router as movies_router
from app.routes.profile import router as profile_router

app = FastAPI()

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(profile_router)

@app.get("/")
def root():
    return {"message": "Letterbox API running"}

@app.get("/movies")
def get_movies():
    try:
        response = supabase.table("movies").select("*").execute()
        return response.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch movies: {exc}")

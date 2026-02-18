from fastapi import FastAPI, HTTPException
from app.database import supabase

app = FastAPI()

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

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Aus .env lesen
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")  # für normale User-Zugriffe
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
	raise RuntimeError(
		"Missing SUPABASE_URL or SUPABASE_ANON_KEY. Check backend/.env configuration."
	)

# Client erstellen
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Optionaler Admin-Client (bypasst RLS) für serverseitige Tasks
supabase_admin = None
if SUPABASE_SERVICE_ROLE_KEY:
	supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

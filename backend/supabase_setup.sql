-- Supabase SQL: Create tables for Letterbox

-- Profile table (optional, for additional user info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  birth_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  rating DECIMAL(3, 1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  review TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'to_watch' CHECK (status IN ('to_watch', 'watching', 'completed', 'on_hold', 'dropped')),
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

-- Custom user lists table
CREATE TABLE IF NOT EXISTS custom_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  sort_mode VARCHAR(30) DEFAULT 'manual' CHECK (sort_mode IN ('manual', 'recently_added', 'rating_desc')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_tmdb_id ON ratings(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_tmdb_id ON watchlist(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);

-- Enable RLS (Row Level Security) for security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see and edit their own ratings
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings;
CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can only see and edit their own watchlist
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
CREATE POLICY "Users can view their own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own watchlist" ON watchlist;
CREATE POLICY "Users can insert their own watchlist" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own watchlist" ON watchlist;
CREATE POLICY "Users can update their own watchlist" ON watchlist
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own watchlist" ON watchlist;
CREATE POLICY "Users can delete their own watchlist" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can only see and edit their own custom lists
DROP POLICY IF EXISTS "Users can view their own custom lists" ON custom_lists;
CREATE POLICY "Users can view their own custom lists" ON custom_lists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom lists" ON custom_lists;
CREATE POLICY "Users can insert their own custom lists" ON custom_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own custom lists" ON custom_lists;
CREATE POLICY "Users can update their own custom lists" ON custom_lists
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own custom lists" ON custom_lists;
CREATE POLICY "Users can delete their own custom lists" ON custom_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id); 

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);  

DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);  


-- Trigger: Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

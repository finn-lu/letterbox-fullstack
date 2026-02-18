-- Supabase SQL: Create tables for Letterbox

-- Profile table (optional, for additional user info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_tmdb_id ON ratings(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_tmdb_id ON watchlist(tmdb_id);

-- Enable RLS (Row Level Security) for security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see and edit their own ratings
CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can only see and edit their own watchlist
CREATE POLICY "Users can view their own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" ON watchlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

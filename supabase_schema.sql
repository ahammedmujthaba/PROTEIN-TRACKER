-- ==============================================================================
-- PROTEIN TRACKER - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Athlete',
  email TEXT,
  avatar TEXT DEFAULT '⚡',
  target_grams INTEGER DEFAULT 150,
  bonus_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BLUEPRINTS TABLE (Scientific questionnaire state)
CREATE TABLE IF NOT EXISTS public.blueprints (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC DEFAULT 75,
  unit TEXT DEFAULT 'kg',
  goal_key TEXT DEFAULT 'muscle',
  activity_key TEXT DEFAULT 'active',
  ratio NUMERIC DEFAULT 2.0,
  meals INTEGER DEFAULT 3,
  is_glp BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROTEIN LOGS TABLE (Individual meal & protein entries)
CREATE TABLE IF NOT EXISTS public.protein_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grams INTEGER NOT NULL,
  name TEXT DEFAULT 'Protein Intake',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date_str TEXT NOT NULL,
  meal_slot INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily log queries per user
CREATE INDEX IF NOT EXISTS idx_protein_logs_user_date ON public.protein_logs(user_id, date_str);

-- 4. CUSTOM PRESETS TABLE (User customized quick-add buttons)
CREATE TABLE IF NOT EXISTS public.custom_presets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams INTEGER NOT NULL,
  tag TEXT DEFAULT 'Quick Add',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER CHALLENGES TABLE (Habit quests progression)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  current_days INTEGER DEFAULT 0,
  completed_dates JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'available',
  claimed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, challenge_id)
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- Ensures users can ONLY access and modify their own data!
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- --- PROFILES POLICIES ---
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- --- BLUEPRINTS POLICIES ---
CREATE POLICY "Users can view own blueprint" 
  ON public.blueprints FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blueprint" 
  ON public.blueprints FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blueprint" 
  ON public.blueprints FOR UPDATE 
  USING (auth.uid() = user_id);

-- --- PROTEIN LOGS POLICIES ---
CREATE POLICY "Users can view own protein logs" 
  ON public.protein_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protein logs" 
  ON public.protein_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protein logs" 
  ON public.protein_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own protein logs" 
  ON public.protein_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- --- CUSTOM PRESETS POLICIES ---
CREATE POLICY "Users can view own presets" 
  ON public.custom_presets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" 
  ON public.custom_presets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" 
  ON public.custom_presets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" 
  ON public.custom_presets FOR DELETE 
  USING (auth.uid() = user_id);

-- --- USER CHALLENGES POLICIES ---
CREATE POLICY "Users can view own challenges" 
  ON public.user_challenges FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own challenges" 
  ON public.user_challenges FOR ALL 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- Automatically creates a profile record when a new user signs up in auth.users
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, target_grams, bonus_xp)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar', '⚡'),
    150,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.blueprints (user_id, weight, unit, goal_key, activity_key, ratio, meals, is_glp, active)
  VALUES (new.id, 75, 'kg', 'muscle', 'active', 2.0, 3, FALSE, TRUE)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

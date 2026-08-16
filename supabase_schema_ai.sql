-- ==============================================================================
-- PROTEIN TRACKER - AI COACHING, SMART NUDGES & REFLECTION REPORTS SCHEMA
-- ==============================================================================

-- 1. AI NUDGES TABLE (Personalized real-time coach alerts & food suggestions)
CREATE TABLE IF NOT EXISTS public.ai_nudges (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL, -- 'deficit_rescue', 'streak_milestone', 'glp_shield', 'morning_boost', 'goal_adjustment'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_foods JSONB DEFAULT '[]'::JSONB,
  action_type TEXT DEFAULT 'none',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_nudges_user ON public.ai_nudges(user_id, created_at DESC);

-- 2. AI REPORTS TABLE (Weekly & Monthly AI Reflection Summaries)
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL, -- 'weekly' or 'monthly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  avg_daily_protein INTEGER NOT NULL,
  goal_hit_rate INTEGER NOT NULL,
  streak_achieved INTEGER NOT NULL,
  ai_summary TEXT NOT NULL,
  key_wins JSONB DEFAULT '[]'::JSONB,
  focus_areas JSONB DEFAULT '[]'::JSONB,
  recommended_goal_adjustment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_user_period ON public.ai_reports(user_id, period_type, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.ai_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- AI Nudges Policies
CREATE POLICY "Users can view own AI nudges" ON public.ai_nudges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI nudges" ON public.ai_nudges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI nudges" ON public.ai_nudges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI nudges" ON public.ai_nudges FOR DELETE USING (auth.uid() = user_id);

-- AI Reports Policies
CREATE POLICY "Users can view own AI reports" ON public.ai_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI reports" ON public.ai_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI reports" ON public.ai_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI reports" ON public.ai_reports FOR DELETE USING (auth.uid() = user_id);

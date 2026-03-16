-- ============================================================
--  PACKD — Nutrition Tables
--  Run this in your Supabase SQL Editor
--  (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- User nutrition profiles (one per user)
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email       text NOT NULL UNIQUE,
  age              integer NOT NULL,
  gender           text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm        numeric NOT NULL,
  weight_kg        numeric NOT NULL,
  target_weight_kg numeric NOT NULL,
  goal             text NOT NULL CHECK (goal IN ('lose', 'gain', 'maintain')),
  activity_level   text NOT NULL DEFAULT 'moderate'
                     CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Meal scan logs (many per user)
CREATE TABLE IF NOT EXISTS meal_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email     text NOT NULL,
  meal_name      text NOT NULL,
  total_calories integer NOT NULL,
  protein_g      numeric DEFAULT 0,
  carbs_g        numeric DEFAULT 0,
  fat_g          numeric DEFAULT 0,
  items          jsonb DEFAULT '[]',
  confidence     text DEFAULT 'medium',
  serving_note   text,
  athlete_tip    text,
  logged_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_logs_user_email_idx ON meal_logs(user_email);
CREATE INDEX IF NOT EXISTS meal_logs_logged_at_idx  ON meal_logs(logged_at DESC);

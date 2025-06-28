/*
  # Learning Platform Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, optional)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `learning_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `topic` (text)
      - `duration_days` (integer)
      - `level` (text)
      - `daily_time` (text)
      - `plan_data` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `daily_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references learning_plans)
      - `day_number` (integer)
      - `subtopic_id` (text)
      - `completed` (boolean)
      - `completed_at` (timestamp, optional)
      - `created_at` (timestamp)
    
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references learning_plans)
      - `day_number` (integer)
      - `questions` (jsonb)
      - `answers` (jsonb)
      - `score` (integer)
      - `total_questions` (integer)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own records

  3. Functions
    - Create updated_at trigger function for automatic timestamp updates
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create learning_plans table
CREATE TABLE IF NOT EXISTS public.learning_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  duration_days integer NOT NULL,
  level text NOT NULL,
  daily_time text NOT NULL,
  plan_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning plans" 
  ON public.learning_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning plans" 
  ON public.learning_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning plans" 
  ON public.learning_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning plans" 
  ON public.learning_plans FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER IF NOT EXISTS update_learning_plans_updated_at
  BEFORE UPDATE ON public.learning_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create daily_progress table
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.learning_plans ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  subtopic_id text NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, plan_id, day_number, subtopic_id)
);

ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily progress" 
  ON public.daily_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily progress" 
  ON public.daily_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily progress" 
  ON public.daily_progress FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily progress" 
  ON public.daily_progress FOR DELETE 
  USING (auth.uid() = user_id);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.learning_plans ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  questions jsonb NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz results" 
  ON public.quiz_results FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" 
  ON public.quiz_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz results" 
  ON public.quiz_results FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz results" 
  ON public.quiz_results FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_is_active ON public.learning_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_plan ON public.daily_progress(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_plan ON public.quiz_results(user_id, plan_id);
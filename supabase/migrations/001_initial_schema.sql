-- LMQB Initial Database Schema
-- Based on SystemArchitect design requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sections table
CREATE TABLE IF NOT EXISTS public.sections (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Questions table (preserving original JSON structure)
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL,
  original_json JSONB NOT NULL, -- Preserves exact original structure
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  rationale TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question options table (normalized for efficient querying)
CREATE TABLE IF NOT EXISTS public.question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL, -- A, B, C, D, E
  option_text TEXT NOT NULL,
  UNIQUE(question_id, option_key)
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('random', 'section', 'timed')),
  section_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  time_limit INTEGER CHECK (time_limit > 0), -- in minutes, for timed quizzes
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0 CHECK (score >= 0)
);

-- Quiz attempts table (individual question attempts)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_taken INTEGER DEFAULT 0 CHECK (time_taken >= 0), -- in seconds
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_questions_section ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_gin ON public.questions USING GIN (original_json);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_type ON public.quiz_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session ON public.quiz_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question ON public.quiz_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON public.questions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles 
  SET last_active = NOW() 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to update last_active on quiz session start
CREATE OR REPLACE TRIGGER update_user_activity
  AFTER INSERT ON public.quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

-- Materialized view for user statistics (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_statistics AS
SELECT 
  up.id as user_id,
  up.display_name,
  up.email,
  COALESCE(stats.total_sessions, 0) as total_sessions,
  COALESCE(stats.total_questions_attempted, 0) as total_questions_attempted,
  COALESCE(stats.correct_answers, 0) as correct_answers,
  COALESCE(ROUND(
    (stats.correct_answers::numeric / NULLIF(stats.total_questions_attempted, 0) * 100), 2
  ), 0) as overall_accuracy,
  COALESCE(stats.avg_time_per_question, 0) as avg_time_per_question,
  up.last_active
FROM public.user_profiles up
LEFT JOIN (
  SELECT 
    qs.user_id,
    COUNT(DISTINCT qs.id) as total_sessions,
    COUNT(qa.id) as total_questions_attempted,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    AVG(qa.time_taken) as avg_time_per_question
  FROM public.quiz_sessions qs
  LEFT JOIN public.quiz_attempts qa ON qs.id = qa.session_id
  GROUP BY qs.user_id
) stats ON up.id = stats.user_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);

-- Function to refresh user statistics
CREATE OR REPLACE FUNCTION public.refresh_user_statistics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_statistics;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Insert default categories and sections based on existing data structure
INSERT INTO public.categories (name, description) VALUES
  ('General', 'General lifestyle medicine questions'),
  ('Board Review Notes', 'Questions from board review materials'),
  ('Study Tool Based', 'Study tool and assessment focused questions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.sections (category_id, name, description) VALUES
  (1, 'Introduction to Lifestyle Medicine', 'Foundational concepts and principles'),
  (1, 'Fundamentals of Health Behavior Change', 'Behavior modification and patient motivation'),
  (1, 'Key Clinical Processes in Lifestyle Medicine', 'Clinical workflows and procedures'),
  (1, 'The Role of The Practitioners Health and Community Advocacy', 'Provider wellness and advocacy'),
  (1, 'Nutrition Science Assessment and Prescription Guidelines', 'Nutrition counseling and interventions'),
  (1, 'Physical Activity Science and Prescription', 'Exercise prescription and fitness assessment'),
  (1, 'Emotional and Mental Health Assessment and Interventions', 'Mental health in lifestyle medicine'),
  (1, 'Sleep Health Science and Interventions', 'Sleep disorders and sleep hygiene'),
  (1, 'Managing Tobacco Cessation and other Toxic Exposures', 'Addiction and environmental health'),
  (1, 'The Role of Connectedness and Positive Psychology', 'Social connections and mental wellness')
ON CONFLICT (category_id, name) DO NOTHING;

-- Copy sections for other categories
INSERT INTO public.sections (category_id, name, description)
SELECT 2, name, description FROM public.sections WHERE category_id = 1
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.sections (category_id, name, description)
SELECT 3, name, description FROM public.sections WHERE category_id = 1
ON CONFLICT (category_id, name) DO NOTHING;
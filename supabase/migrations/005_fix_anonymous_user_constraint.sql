-- Fix foreign key constraint to allow anonymous quiz sessions
-- This allows anonymous users to create quiz sessions without requiring auth.users entries

-- Drop the existing foreign key constraint on quiz_sessions.user_id
ALTER TABLE public.quiz_sessions 
DROP CONSTRAINT IF EXISTS quiz_sessions_user_id_fkey;

-- Modify user_id column to allow NULL values and don't enforce foreign key for anonymous sessions
-- For anonymous sessions, we'll store a generated UUID that doesn't need to exist in auth.users
-- For authenticated sessions, we'll still validate the user_id exists

-- Add a new column to track if this is an anonymous session
ALTER TABLE public.quiz_sessions 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Create a conditional foreign key constraint using a check constraint
-- This allows either:
-- 1. user_id IS NULL and is_anonymous = TRUE (anonymous sessions)
-- 2. user_id references auth.users(id) and is_anonymous = FALSE (authenticated sessions)

-- For now, we'll just remove the foreign key constraint entirely
-- and rely on application logic to handle user validation

-- Create index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_anonymous ON public.quiz_sessions(user_id, is_anonymous);

-- Update existing RLS policies to handle anonymous sessions properly
-- This will be handled in the RLS migration file
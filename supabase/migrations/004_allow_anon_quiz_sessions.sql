-- Allow anonymous users to create and manage quiz sessions for timed exams
-- This enables anonymous users to take LMQB exams without requiring authentication

-- Allow anonymous users to create quiz sessions
CREATE POLICY "Allow anonymous quiz session creation" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to read their own quiz sessions
CREATE POLICY "Allow anonymous to read quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.role() = 'anon');

-- Allow anonymous users to update their own quiz sessions  
CREATE POLICY "Allow anonymous to update quiz sessions" ON public.quiz_sessions
  FOR UPDATE USING (auth.role() = 'anon');

-- Allow anonymous users to create quiz attempts
CREATE POLICY "Allow anonymous quiz attempt creation" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Allow anonymous users to read quiz attempts
CREATE POLICY "Allow anonymous to read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.role() = 'anon');

-- Allow anonymous users to update quiz attempts
CREATE POLICY "Allow anonymous to update quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.role() = 'anon');

-- Grant necessary permissions to anonymous role
GRANT INSERT, SELECT, UPDATE ON public.quiz_sessions TO anon;
GRANT INSERT, SELECT, UPDATE ON public.quiz_attempts TO anon;

-- Grant sequence permissions for serial columns to anonymous
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
-- Allow anonymous access to read quiz data
-- This enables public access to categories, sections, questions, and options
-- for quiz/exam functionality without requiring authentication

-- Categories - allow anonymous read access
CREATE POLICY "Allow anonymous read access to categories" ON public.categories
  FOR SELECT USING (true);

-- Sections - allow anonymous read access  
CREATE POLICY "Allow anonymous read access to sections" ON public.sections
  FOR SELECT USING (true);

-- Questions - allow anonymous read access
CREATE POLICY "Allow anonymous read access to questions" ON public.questions
  FOR SELECT USING (true);

-- Question options - allow anonymous read access
CREATE POLICY "Allow anonymous read access to question_options" ON public.question_options
  FOR SELECT USING (true);

-- Grant read permissions to anonymous role
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.sections TO anon;
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.question_options TO anon;
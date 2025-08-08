-- Row Level Security (RLS) Policies for LMQB
-- Ensures users can only access their own data and admins have broader access

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Categories policies (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Sections policies (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view sections" ON public.sections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage sections" ON public.sections
  FOR ALL USING (public.is_admin());

-- Questions policies (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view questions" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL USING (public.is_admin());

-- Question options policies (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view question options" ON public.question_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage question options" ON public.question_options
  FOR ALL USING (public.is_admin());

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.is_admin());

-- Quiz sessions policies
CREATE POLICY "Users can view their own quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions" ON public.quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (public.is_admin());

-- Quiz attempts policies
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions 
      WHERE id = quiz_attempts.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions 
      WHERE id = quiz_attempts.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions 
      WHERE id = quiz_attempts.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_admin());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.sections TO authenticated;
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.question_options TO authenticated;

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_attempts TO authenticated;

-- Grant sequence permissions for serial columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on materialized view
GRANT SELECT ON public.user_statistics TO authenticated;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_statistics() TO authenticated;
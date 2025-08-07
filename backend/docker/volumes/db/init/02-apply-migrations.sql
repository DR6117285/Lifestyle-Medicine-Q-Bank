-- Apply LMQB Database Migrations
-- This script applies the existing migrations from /backend/supabase/migrations/

\echo 'Applying LMQB database migrations...'

-- Apply the initial schema migration
\i /home/dr6117285/lmqb/backend/supabase/migrations/001_initial_schema.sql

-- Apply the RLS migration if it exists
\ir /home/dr6117285/lmqb/backend/supabase/migrations/002_row_level_security.sql

\echo 'LMQB database migrations completed successfully.'
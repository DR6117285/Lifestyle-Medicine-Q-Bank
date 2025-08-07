-- Realtime Database Setup for Supabase
-- This script sets up the necessary schemas, tables, and functions for Supabase Realtime

BEGIN;

-- Create _realtime schema
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant usage on schema to postgres
GRANT USAGE ON SCHEMA _realtime TO postgres;

-- Create realtime admin role
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        CREATE ROLE supabase_realtime_admin;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA _realtime TO supabase_realtime_admin;

-- Enable Realtime for public schema tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Create realtime subscription tracking table
CREATE TABLE IF NOT EXISTS _realtime.subscription (
    id BIGSERIAL PRIMARY KEY,
    subscription_id UUID NOT NULL,
    entity REGCLASS NOT NULL,
    filters REALTIME.USER_DEFINED_FILTER[] NOT NULL DEFAULT '{}',
    claims JSONB NOT NULL,
    claims_role REGROLE GENERATED ALWAYS AS (REALTIME.ROLE(claims)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on subscription table
CREATE UNIQUE INDEX IF NOT EXISTS subscription_subscription_id_entity_filters_idx 
  ON _realtime.subscription USING BTREE (subscription_id, entity, filters);

CREATE INDEX IF NOT EXISTS subscription_entity_idx 
  ON _realtime.subscription USING BTREE (entity);

CREATE INDEX IF NOT EXISTS subscription_claims_role_idx 
  ON _realtime.subscription USING BTREE (claims_role);

-- Grant permissions on subscription table
GRANT SELECT, INSERT, UPDATE, DELETE ON _realtime.subscription TO supabase_realtime_admin;
GRANT USAGE ON SEQUENCE _realtime.subscription_id_seq TO supabase_realtime_admin;

-- Create extension table for realtime
CREATE TABLE IF NOT EXISTS _realtime.extension (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    settings JSONB,
    tenant_external_id TEXT,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT extension_pkey PRIMARY KEY (id)
);

-- Grant permissions on extension table
GRANT SELECT, INSERT, UPDATE, DELETE ON _realtime.extension TO supabase_realtime_admin;

-- Create schema_migrations table for realtime
CREATE TABLE IF NOT EXISTS _realtime.schema_migrations (
    version BIGINT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);

-- Grant permissions on schema_migrations table
GRANT SELECT, INSERT, UPDATE, DELETE ON _realtime.schema_migrations TO supabase_realtime_admin;

-- Insert initial migration version
INSERT INTO _realtime.schema_migrations (version) VALUES (20211116024918) ON CONFLICT (version) DO NOTHING;

COMMIT;
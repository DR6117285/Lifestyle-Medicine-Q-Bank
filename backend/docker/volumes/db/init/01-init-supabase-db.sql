-- Supabase Database Initialization Script
-- This script creates the necessary users, roles, and permissions for Supabase

BEGIN;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Create custom roles for Supabase
-- Anonymous role (for unauthenticated requests)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOINHERIT;
    END IF;
END
$$;

-- Authenticated role (for authenticated requests)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOINHERIT;
    END IF;
END
$$;

-- Service role (for server-side operations)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOINHERIT BYPASSRLS;
    END IF;
END
$$;

-- Authenticator role (used by PostgREST)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN;
    END IF;
END
$$;

-- Supabase admin roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN;
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN;
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        CREATE ROLE supabase_realtime_admin NOINHERIT CREATEROLE LOGIN;
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_postgres_meta') THEN
        CREATE ROLE supabase_postgres_meta NOINHERIT CREATEROLE LOGIN;
    END IF;
END
$$;

-- Set passwords for admin roles (using the same password from .env for simplicity)
ALTER ROLE supabase_auth_admin PASSWORD 'dev-password-for-local-testing-only';
ALTER ROLE supabase_storage_admin PASSWORD 'dev-password-for-local-testing-only';
ALTER ROLE supabase_realtime_admin PASSWORD 'dev-password-for-local-testing-only';
ALTER ROLE supabase_postgres_meta PASSWORD 'dev-password-for-local-testing-only';
ALTER ROLE authenticator PASSWORD 'dev-password-for-local-testing-only';

-- Grant roles
GRANT anon, authenticated, service_role TO authenticator;
GRANT anon, authenticated, service_role TO postgres;

-- Allow roles to use extensions
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS graphql;
CREATE SCHEMA IF NOT EXISTS graphql_public;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA storage TO supabase_storage_admin;
GRANT USAGE ON SCHEMA realtime TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Grant schema creation permissions
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;

-- Enable Row Level Security on public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Create realtime publication
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END
$$;

-- Grant replication to realtime admin
ALTER ROLE supabase_realtime_admin REPLICATION;

-- Create pgsodium extension for encryption
CREATE EXTENSION IF NOT EXISTS pgsodium;

COMMIT;
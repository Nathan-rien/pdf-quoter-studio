-- Add 'commercial' value to the app_role enum
-- This is required because the application code references this role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'commercial';
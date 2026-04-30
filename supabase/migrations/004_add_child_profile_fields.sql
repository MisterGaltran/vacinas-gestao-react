-- Migration 004: Add profile fields to children table
-- Execute in Supabase SQL Editor

ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS parental_email TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS maternity TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS cpf TEXT;
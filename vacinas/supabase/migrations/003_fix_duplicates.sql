-- Migration 003: Remove duplicate vaccine_types and add unique partial index
-- Execute this in Supabase SQL Editor

-- 1. Remove duplicate entries (keep the oldest by MIN id), excluding custom vaccines
DELETE FROM vaccine_types
WHERE id NOT IN (
    SELECT MIN(id)
    FROM vaccine_types
    WHERE is_custom = false
    GROUP BY name, disease, dose_number
)
AND is_custom = false;

-- 2. Create a partial unique index to prevent future duplicates for PNI (non-custom) vaccines
-- This allows custom vaccines with same name/disease/dose_number for different children
CREATE UNIQUE INDEX IF NOT EXISTS unique_pni_vaccine
ON vaccine_types (name, disease, dose_number, is_custom)
WHERE is_custom = false;
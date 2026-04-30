-- Migration 003: Remove duplicate vaccine_types and add unique partial index
-- Execute this in Supabase SQL Editor

-- 1. Remove duplicate entries (keep one row per unique name+disease+dose_number using native UUID ordering)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY name, disease, dose_number
        ORDER BY id ASC
    ) AS rn
    FROM vaccine_types
    WHERE is_custom = false
)
DELETE FROM vaccine_types
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
AND is_custom = false;

-- 2. Create a partial unique index to prevent future duplicates for PNI (non-custom) vaccines
-- This allows custom vaccines with same name/disease/dose_number for different children
CREATE UNIQUE INDEX IF NOT EXISTS unique_pni_vaccine
ON vaccine_types (name, disease, dose_number, is_custom)
WHERE is_custom = false;
-- ============================================
-- SCRIPT COMPLETO PARA APLICAR TODAS AS MIGRATIONS
-- Execute este arquivo COMPLETO no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/mbcfclgjkngobqkpjmjv/sql/new
-- ============================================

-- ============================================
-- Migration 001: Schema inicial
-- ============================================

-- Tabela de crianças
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tipos de vacina (calendário PNI + customizadas)
CREATE TABLE IF NOT EXISTS vaccine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  disease TEXT NOT NULL,
  dose_number INTEGER NOT NULL DEFAULT 1,
  total_doses INTEGER NOT NULL DEFAULT 1,
  recommended_age_months INTEGER NOT NULL,
  min_interval_days INTEGER,
  description TEXT DEFAULT '',
  is_custom BOOLEAN DEFAULT false,
  custom_child_id UUID REFERENCES children(id) ON DELETE CASCADE
);

-- Tabela de registros de vacinação
CREATE TABLE IF NOT EXISTS vaccine_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  vaccine_type_id UUID NOT NULL REFERENCES vaccine_types(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  administered_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'late', 'upcoming')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_records_child ON vaccine_records(child_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON vaccine_records(status);
CREATE INDEX IF NOT EXISTS idx_vaccine_types_custom ON vaccine_types(is_custom);

-- ============================================
-- Migration 004: Adicionar campos de perfil
-- ============================================

ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS parental_email TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS maternity TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS cpf TEXT;

-- ============================================
-- Políticas RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view own family children" ON children;
DROP POLICY IF EXISTS "Users can insert own family children" ON children;
DROP POLICY IF EXISTS "Users can update own family children" ON children;
DROP POLICY IF EXISTS "Users can delete own family children" ON children;

DROP POLICY IF EXISTS "Users can view vaccine types" ON vaccine_types;
DROP POLICY IF EXISTS "Users can insert custom vaccine types" ON vaccine_types;
DROP POLICY IF EXISTS "Users can delete own custom vaccine types" ON vaccine_types;

DROP POLICY IF EXISTS "Users can view own family records" ON vaccine_records;
DROP POLICY IF EXISTS "Users can insert own family records" ON vaccine_records;
DROP POLICY IF EXISTS "Users can update own family records" ON vaccine_records;
DROP POLICY IF EXISTS "Users can delete own family records" ON vaccine_records;

-- Política: usuário vê apenas filhos da sua família
CREATE POLICY "Users can view own family children"
  ON children FOR SELECT
  USING (family_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own family children"
  ON children FOR INSERT
  WITH CHECK (family_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own family children"
  ON children FOR UPDATE
  USING (family_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own family children"
  ON children FOR DELETE
  USING (family_id = (SELECT auth.uid()));

-- Política: tipos de vacina do PNI são visíveis para todos autenticados
-- Vacinas customizadas só são visíveis para a família dona
CREATE POLICY "Users can view vaccine types"
  ON vaccine_types FOR SELECT
  USING (
    is_custom = false
    OR (
      is_custom = true
      AND custom_child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can insert custom vaccine types"
  ON vaccine_types FOR INSERT
  WITH CHECK (
    is_custom = true
    AND custom_child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can delete own custom vaccine types"
  ON vaccine_types FOR DELETE
  USING (
    is_custom = true
    AND custom_child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );

-- Política: registros de vacina vinculados a filhos da família
CREATE POLICY "Users can view own family records"
  ON vaccine_records FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can insert own family records"
  ON vaccine_records FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can update own family records"
  ON vaccine_records FOR UPDATE
  USING (
    child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can delete own family records"
  ON vaccine_records FOR DELETE
  USING (
    child_id IN (SELECT id FROM children WHERE family_id = (SELECT auth.uid()))
  );
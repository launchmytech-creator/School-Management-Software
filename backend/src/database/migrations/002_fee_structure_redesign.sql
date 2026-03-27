-- ============================================
-- Migration 002: Fee Structure Redesign
-- Run this manually in your PostgreSQL database
-- ============================================

-- 1. Add fee_terms column to fee_structures (stores payment frequency per class+year group)
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS fee_terms INTEGER NOT NULL DEFAULT 1;

-- 2. Add fee_breakdown column to fee_transactions (stores per-component split as JSON)
ALTER TABLE fee_transactions ADD COLUMN IF NOT EXISTS fee_breakdown JSONB;

-- 3. Drop the old unique constraint that included term_number
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_school_id_class_id_academic_year_id_fee_type_term_number_key;

-- 4. Drop term_number column (no longer needed — components are annual, splitting happens at transaction level)
ALTER TABLE fee_structures DROP COLUMN IF EXISTS term_number;

-- 5. Remove duplicate rows — keep only the first row per (school_id, class_id, academic_year_id, fee_type)
DELETE FROM fee_structures
WHERE id NOT IN (
  SELECT MIN(id)
  FROM fee_structures
  GROUP BY school_id, class_id, academic_year_id, fee_type
);

-- 6. Add new unique constraint: one component per class+year+feeType
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_unique_component;
ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_unique_component
  UNIQUE (school_id, class_id, academic_year_id, fee_type);

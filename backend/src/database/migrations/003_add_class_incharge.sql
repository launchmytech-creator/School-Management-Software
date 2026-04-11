-- Migration: 003_add_class_incharge
-- Description: Add incharge_id column to classes table for class incharge attendance system

-- Add incharge_id column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS incharge_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_incharge ON classes(incharge_id);

-- Add comment for documentation
COMMENT ON COLUMN classes.incharge_id IS 'The teacher assigned as class incharge/homeroom teacher who can mark attendance';

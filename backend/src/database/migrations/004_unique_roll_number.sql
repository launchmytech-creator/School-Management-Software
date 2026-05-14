-- Migration: 004_unique_roll_number
-- Description: Add unique constraint on roll_number per school for students table

-- Add unique constraint on roll_number per class within a school
-- This ensures that roll numbers are unique within each class
ALTER TABLE students DROP CONSTRAINT IF EXISTS unique_roll_number_per_school;
ALTER TABLE students ADD CONSTRAINT unique_roll_number_per_school UNIQUE (school_id, current_class_id, roll_number);

-- Create index for faster lookups if not exists
CREATE INDEX IF NOT EXISTS idx_students_school_class_roll ON students(school_id, current_class_id, roll_number);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_roll_number_per_school ON students IS 'Ensures roll_number is unique within each class in a school';

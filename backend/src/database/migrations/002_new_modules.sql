-- ============================================
-- School Management System - New Modules
-- ============================================

-- ============================================
-- 1. ANNOUNCEMENTS
-- ============================================

-- Add new columns to existing announcements table (idempotent)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_roles JSONB;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_academic_year ON announcements(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================
-- 2. TIMETABLES
-- ============================================

CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    period_number INTEGER NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, academic_year_id, day_of_week, period_number)
);

CREATE INDEX idx_timetables_school ON timetables(school_id);
CREATE INDEX idx_timetables_class ON timetables(class_id);
CREATE INDEX idx_timetables_academic_year ON timetables(academic_year_id);
CREATE INDEX idx_timetables_day ON timetables(day_of_week);

-- ============================================
-- 3. ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    max_marks INTEGER,
    assignment_type VARCHAR(50) DEFAULT 'homework',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_school ON assignments(school_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_academic_year ON assignments(academic_year_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date DESC);

-- ============================================
-- 4. ASSIGNMENT SUBMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submission_text TEXT,
    file_url VARCHAR(500),
    marks_obtained INTEGER,
    feedback TEXT,
    graded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- 5. SCHOOL SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS school_settings (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
    school_name VARCHAR(200),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    logo_url VARCHAR(500),
    grading_system JSONB DEFAULT '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}',
    attendance_policy JSONB DEFAULT '{"allowed_leaves": 10, "require_medical_certificate": true}',
    term_structure JSONB DEFAULT '{"terms": 3, "duration_months": 4}',
    working_days JSONB DEFAULT '{"days": [1, 2, 3, 4, 5]}',
    exam_policy JSONB DEFAULT '{"passing_marks": 35, "internal_weightage": 25}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_settings_school ON school_settings(school_id);

-- Insert default settings for existing schools
INSERT INTO school_settings (school_id)
SELECT id FROM schools
WHERE id NOT IN (SELECT school_id FROM school_settings);

-- ============================================
-- 6. REPORTS CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS report_templates (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_templates_school ON report_templates(school_id);
CREATE INDEX idx_report_templates_type ON report_templates(type);

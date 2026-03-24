-- ============================================
-- School Management System - Complete Schema
-- Fixed Version - All Logical Errors Resolved
-- ============================================

-- ============================================
-- 1. SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    features JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (name, features) VALUES
('Basic', '{"fee_management": true, "marks_management": true, "attendance": false, "syllabus_tracking": false, "teacher_allocation": false, "analytics": false}'),
('Premium', '{"fee_management": true, "marks_management": true, "attendance": true, "syllabus_tracking": true, "teacher_allocation": false, "analytics": false}'),
('Business', '{"fee_management": true, "marks_management": true, "attendance": true, "syllabus_tracking": true, "teacher_allocation": true, "analytics": true}');

-- ============================================
-- 2. SCHOOLS
-- ============================================

CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subscription_plan_id INTEGER REFERENCES subscription_plans(id),
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_end_date DATE,
    fee_terms INTEGER NOT NULL DEFAULT 1,
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. SUBSCRIPTION HISTORY
-- ============================================

CREATE TABLE subscription_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_history_school ON subscription_history(school_id);

-- ============================================
-- 4. FEE TERMS HISTORY
-- ============================================

CREATE TABLE fee_terms_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    fee_terms INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fee_terms_history_school ON fee_terms_history(school_id);

-- ============================================
-- 5. USERS
-- ============================================
-- FIXED: school_id is now nullable for super_admin
-- FIXED: email unique per school, not globally

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, email)
);

CREATE INDEX idx_users_school_role ON users(school_id, role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 6. ACADEMIC YEARS
-- ============================================

CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    year_name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    UNIQUE(school_id, year_name)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);

-- ============================================
-- 7. CLASSES
-- ============================================

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    section VARCHAR(10),
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    default_fee_amount DECIMAL(10,2),
    UNIQUE(school_id, name, section, academic_year_id)
);

CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);

-- ============================================
-- 8. SUBJECTS
-- ============================================

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    UNIQUE(school_id, code)
);

CREATE INDEX idx_subjects_school ON subjects(school_id);

-- ============================================
-- 9. CHAPTERS
-- ============================================
-- FIXED: Added school_id for multi-tenancy
-- FIXED: Added unique constraint on (subject_id, name)

CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, name)
);

CREATE INDEX idx_chapters_school ON chapters(school_id);
CREATE INDEX idx_chapters_subject ON chapters(subject_id);

-- ============================================
-- 10. CLASS SUBJECTS
-- ============================================
-- FIXED: Added school_id for multi-tenancy
-- FIXED: Added academic_year_id for yearly tracking
-- FIXED: Removed teacher_id (use teacher_allocations instead)

CREATE TABLE class_subjects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    max_marks DECIMAL(5,2),
    UNIQUE(class_id, subject_id, academic_year_id)
);

CREATE INDEX idx_class_subjects_school ON class_subjects(school_id);
CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_academic_year ON class_subjects(academic_year_id);

-- ============================================
-- 11. TEACHER ALLOCATIONS
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE teacher_allocations (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id, subject_id, academic_year_id)
);

CREATE INDEX idx_teacher_allocations_school ON teacher_allocations(school_id);
CREATE INDEX idx_teacher_allocations_teacher ON teacher_allocations(teacher_id);
CREATE INDEX idx_teacher_allocations_class ON teacher_allocations(class_id);
CREATE INDEX idx_teacher_allocations_academic_year ON teacher_allocations(academic_year_id);

-- ============================================
-- 12. SYLLABUS COMPLETION
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE syllabus_completion (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_subject_id INTEGER REFERENCES class_subjects(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    completed_date DATE,
    completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    UNIQUE(class_subject_id, chapter_id)
);

CREATE INDEX idx_syllabus_completion_school ON syllabus_completion(school_id);
CREATE INDEX idx_syllabus_completion_status ON syllabus_completion(status);
CREATE INDEX idx_syllabus_completion_class_subject ON syllabus_completion(class_subject_id);

-- ============================================
-- 13. STUDENTS
-- ============================================

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    phone VARCHAR(20),
    admission_date DATE NOT NULL,
    current_class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    roll_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, admission_number)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_school_class ON students(school_id, current_class_id);
CREATE INDEX idx_students_status ON students(status);

-- ============================================
-- 14. STUDENT PROMOTIONS
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE student_promotions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    from_class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    to_class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    from_academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
    to_academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
    promoted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    promotion_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_promotions_school ON student_promotions(school_id);
CREATE INDEX idx_student_promotions_student ON student_promotions(student_id);

-- ============================================
-- 15. STUDENT ATTENDANCE
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE student_attendance (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date)
);

CREATE INDEX idx_student_attendance_school ON student_attendance(school_id);
CREATE INDEX idx_student_attendance_date ON student_attendance(attendance_date);
CREATE INDEX idx_student_attendance_school_date ON student_attendance(school_id, attendance_date);
CREATE INDEX idx_student_attendance_student ON student_attendance(student_id);

-- ============================================
-- 16. TEACHER ATTENDANCE
-- ============================================

CREATE TABLE teacher_attendance (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, attendance_date)
);

CREATE INDEX idx_teacher_attendance_school ON teacher_attendance(school_id);
CREATE INDEX idx_teacher_attendance_date ON teacher_attendance(attendance_date);
CREATE INDEX idx_teacher_attendance_school_date ON teacher_attendance(school_id, attendance_date);

-- ============================================
-- 17. HOLIDAYS
-- ============================================

CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description VARCHAR(200),
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(school_id, holiday_date)
);

CREATE INDEX idx_holidays_school ON holidays(school_id);
CREATE INDEX idx_holidays_school_date ON holidays(school_id, holiday_date);
CREATE INDEX idx_holidays_academic_year ON holidays(academic_year_id);

-- ============================================
-- 18. FEE STRUCTURES
-- ============================================
-- FIXED: Added unique constraint

CREATE TABLE fee_structures (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    term_number INTEGER,
    UNIQUE(school_id, class_id, academic_year_id, fee_type, term_number)
);

CREATE INDEX idx_fee_structures_school ON fee_structures(school_id);
CREATE INDEX idx_fee_structures_class ON fee_structures(class_id);
CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year_id);

-- ============================================
-- 19. FEE TRANSACTIONS
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE fee_transactions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id),
    term_number INTEGER,
    original_amount DECIMAL(10,2),
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    waiver_amount DECIMAL(10,2) DEFAULT 0,
    waiver_reason TEXT,
    waiver_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_mode VARCHAR(20),
    receipt_number VARCHAR(50),
    collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fee_transactions_school ON fee_transactions(school_id);
CREATE INDEX idx_fee_transactions_student ON fee_transactions(student_id);
CREATE INDEX idx_fee_transactions_status ON fee_transactions(status);
CREATE INDEX idx_fee_transactions_school_status ON fee_transactions(school_id, status);
CREATE INDEX idx_fee_transactions_academic_year ON fee_transactions(academic_year_id);

-- ============================================
-- 20. EXAMS
-- ============================================

CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    exam_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weightage DECIMAL(5,2)
);

CREATE INDEX idx_exams_school ON exams(school_id);
CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_exams_academic_year ON exams(academic_year_id);

-- ============================================
-- 21. EXAM SUBJECTS
-- ============================================
-- FIXED: Added school_id for multi-tenancy

CREATE TABLE exam_subjects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    max_marks DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    UNIQUE(exam_id, subject_id)
);

CREATE INDEX idx_exam_subjects_school ON exam_subjects(school_id);
CREATE INDEX idx_exam_subjects_exam ON exam_subjects(exam_id);
CREATE INDEX idx_exam_subjects_subject ON exam_subjects(subject_id);

-- ============================================
-- 22. EXAM RESULTS
-- ============================================
-- FIXED: Added school_id for multi-tenancy
-- FIXED: Added entered_by and entered_at for audit trail

CREATE TABLE exam_results (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    exam_subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2),
    grade VARCHAR(5),
    is_absent BOOLEAN DEFAULT false,
    entered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_subject_id, student_id)
);

CREATE INDEX idx_exam_results_school ON exam_results(school_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_exam_subject ON exam_results(exam_subject_id);

-- ============================================
-- 23. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    channel VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ============================================
-- 24. ANNOUNCEMENTS
-- ============================================

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(20),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- ============================================
-- 25. AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_school ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

School Management System
System Architecture & Functional Documentation (Version 1)

1. Project Overview

The School Management System (SMS) is a multi-tenant platform that allows multiple schools to manage their academic and administrative activities digitally.

The system supports different subscription plans and role-based access control (RBAC) for managing operations performed by different stakeholders such as:

Super Admin

School Admin

Accountant

Teacher

Parents

The platform enables management of:

Student records

Fees and payments

Attendance

Marks and academic performance

Subject and syllabus completion

Notifications

Teacher allocation

Each school will operate independently inside the system.

2. Subscription Plans

The system follows a plan-based feature access model.

Basic Plan

Features included:

Fee management

Fee payment tracking

Marks management

This plan is suitable for schools that only need financial and academic performance tracking.

Premium Plan

Includes all features from Basic Plan plus:

Student attendance management

Teacher attendance management

Syllabus completion tracking

This plan allows schools to monitor academic progress and student presence.

Business Plan

Includes all system features:

Fee management

Marks management

Attendance management

Syllabus completion monitoring

Teacher allocation

Academic analytics

Notifications

Class comparison analytics

This plan is designed for schools that want complete digital management.

Plan Flexibility

Schools can upgrade or downgrade their plan at any time.

Important design rule:

When a school changes plan, existing historical data must not be affected.

Example:

If a school downgrades from Premium → Basic, old attendance data must remain stored but new attendance entries should be disabled.

3. System Roles

The system supports the following roles:

Super Admin

School Admin

Accountant

Teacher

Parent

Access control will be implemented using Role Based Access Control (RBAC).

Each role will have restricted permissions.

4. Super Admin Responsibilities

Super Admin manages the entire platform across all schools.

Operations

1. Create School

Super Admin can register a new school in the system.

During creation, the following information will be configured:

School name

Academic year

Fee structure

Fee submission terms

2. Define Fee Terms

While creating a school, the Super Admin will define how fees are submitted.

Examples:

Yearly (1 term)

Half-yearly (2 terms)

Quarterly (4 terms)

Monthly (12 terms)

This configuration defines how the system will generate fee records.

3. Update Fee Terms

Super Admin can modify fee submission terms for a school.

Important rule:

Historical fee data must remain unchanged.

New fee structure will apply only to future records.

Example:

If a school switches from 3 terms → monthly, existing fee records must remain based on the old structure.

5. School Admin Role

The Admin manages operations inside a particular school.

Admin has the highest authority inside a school.

6. Admin – Create Operations

All created entities must support Edit / Update functionality.

1. Class Creation

Admin can create different classes.

Example:

Class 1

Class 2

Class 3

Class 4

Class 5

Each class can have a default fee amount.

Example:

Class 5 → ₹25,000 yearly fee.

2. Student / Teacher / Accountant Management

Admin can:

Create students

Delete students

Create teachers

Delete teachers

Create accountants

Delete accountants

Admin can also update user information.

3. Student Promotion (Class Shifting)

Admin can promote students to the next class.

Example:

From Class 4 → Class 5

The system will provide a student checklist.

Admin will select students and update:

Class

Section

Academic year

Example:

Class 4(A) → Class 5(A)
Year: 2025 → 2026

4. Fee Status Update

Admin can update the fee submission status.

Example:

Paid

Pending

Partial

Accountant also has permission to update fee payment status.

5. Fee Waiver / Adjustment

Admin can modify the fee amount for a particular student.

Example cases:

Scholarship

Financial difficulty

Fee waiver

Accountant cannot change the fee amount.

Only Admin can do this.

6. Teacher, Subject and Chapter Management

Admin can:

Create subjects

Create chapters

Assign chapters to subjects

Delete subjects or chapters

7. Fee Due Notification

Admin can send notifications to parents who have not paid their fees.

Example message:

"Reminder: Your child's school fee is pending for Term 2."

8. Teacher Allocation

Admin can assign teachers to subjects and classes.

Example:

Teacher: Rohit
Subject: Science
Class: 5(A)
Academic Year: 2026–2027

Another assignment:

Teacher: Rohit
Subject: Mathematics
Class: 9(A)
Academic Year: 2026–2027

The system should support multiple allocations per teacher.

9. Holiday Management

Admin can mark specific dates as holidays.

Example:

National holidays

School events

Emergency closure

These dates will be excluded from attendance calculations.

Example:

Total school days = 215 instead of 365.

7. Admin – View / Get Operations

Admin can view analytical and operational data.

1. Teacher Overview

Admin can see:

Teacher list

Subjects assigned

Classes assigned

2. Student Attendance

Admin can see:

Attendance of every student

Date-wise attendance

Teacher who marked attendance

3. Student Marks

Admin can see marks for:

Class tests

Unit tests

Half yearly exam

Final exam

Marks will be subject-wise.

4. Student Performance Graph

Admin can view a graph showing student performance trend.

Example:

Marks progression from Term 1 → Term 2 → Final.

5. Class Performance Comparison

Admin can compare the performance of multiple classes.

Example:

Class 5(A) vs Class 5(B)

Graph will show:

Average marks

Performance trend

6. Fee Status Monitoring

Admin can see:

Fee status of each class

Fee status of each student

7. Fee Defaulter List

Admin can view a list of students who have not paid their fees.

Details shown:

Student name

Class

Parent details

Fee due amount

8. Teacher Attendance

Admin can view teacher attendance records.

Example:

Date | Teacher | Status
12 Jan | Rohit | Present

9. Syllabus Completion Monitoring

Admin can track syllabus progress.

Workflow:

Admin → Class → Subject → Chapters

Example:

Class 5(A)

Subject: Science

Chapters:

Plants – Completed

Animals – Completed

Environment – Pending

10. School Working Days

Admin can see:

Total school open days

Student attendance ratio

Example:

187 / 215

Where:

187 = Days student attended

215 = Total school working days

8. Accountant Role

The Accountant mainly handles financial and academic record updates.

Accountant Permissions

Accountant can:

Create new students

Mark attendance

Generate fee receipts

Send fee reminder notifications

Create subjects and chapters

Upload student marks

Update student information

Restrictions

Accountant cannot change the fee amount.

Fee modification is restricted to Admin only.

9. Teacher Role

Teachers focus on academic activities.

Teacher Operations

Teachers can:

Mark student attendance.

Create chapters under subjects.

Update syllabus progress.

Mark chapters as completed.

Example:

Subject: Science
Chapter: Photosynthesis → Completed

This helps Admin monitor syllabus completion progress.

10. Parent Role

Parents have read-only access to their child's information.

Parent Features

Parents can view:

Subject-wise marks

Monthly attendance

Fee status

Syllabus completion

Teacher contact details

Attendance Summary

Parents can see attendance ratio.

Example:

187 / 215

Where:

187 = Present days

215 = School open days

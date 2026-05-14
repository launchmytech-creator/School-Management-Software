import { Home, Users, BookOpen, UserCog, DollarSign, Calendar, FileText, Settings, Megaphone, GraduationCap, Plus, Building } from 'lucide-react';

export type UserRole = 'super_admin' | 'school_admin' | 'accountant' | 'teacher' | 'parent';

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  school_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Classes', path: '/admin/classes', icon: BookOpen },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Teachers', path: '/admin/teachers', icon: UserCog },
    { label: 'Parents', path: '/admin/parents', icon: Users },
    { label: 'Accountants', path: '/admin/accountants', icon: UserCog },
    { label: 'Fee Collection', path: '/admin/fees', icon: DollarSign },
    { label: 'Fee Structures', path: '/admin/fee-structures', icon: FileText },
    { label: 'Fee Defaulters', path: '/admin/fee-defaulters', icon: DollarSign },
    { label: 'Exams', path: '/admin/exams', icon: FileText },
    { label: 'Exam Results', path: '/admin/exam-results', icon: GraduationCap },
    { label: 'Marks Entry', path: '/admin/marks-entry', icon: FileText },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Syllabus', path: '/admin/syllabus-tracking', icon: FileText },
    { label: 'Attendance', path: '/admin/attendance', icon: Calendar },
    { label: 'Teacher Attendance', path: '/admin/teacher-attendance', icon: Calendar },
    { label: 'Holidays', path: '/admin/holidays', icon: Calendar },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Academic Years', path: '/admin/academic-years', icon: Calendar },
    { label: 'Timetables', path: '/admin/timetables', icon: Calendar },
    { label: 'Student Promotion', path: '/admin/student-promotion', icon: GraduationCap },
    { label: 'Assignments', path: '/admin/assignments', icon: FileText },
    { label: 'School Settings', path: '/admin/school-settings', icon: Settings },
  ],
  accountant: [
    { label: 'Dashboard', path: '/accountant/dashboard', icon: Home },
    { label: 'Students', path: '/accountant/students', icon: Users },
    { label: 'Fee Collection', path: '/accountant/fees', icon: DollarSign },
    { label: 'Fee Structures', path: '/accountant/fee-structures', icon: FileText },
    { label: 'Fee Defaulters', path: '/accountant/fee-defaulters', icon: DollarSign },
    { label: 'Exams', path: '/accountant/exams', icon: FileText },
    { label: 'Exam Results', path: '/accountant/exam-results', icon: GraduationCap },
    { label: 'Marks Entry', path: '/accountant/marks-entry', icon: FileText },
    { label: 'Subjects', path: '/accountant/subjects', icon: BookOpen },
    { label: 'Attendance', path: '/accountant/attendance', icon: Calendar },
    { label: 'Announcements', path: '/accountant/announcements', icon: Megaphone },
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: Home },
    { label: 'My Classes', path: '/teacher/my-classes', icon: BookOpen },
    { label: 'Students', path: '/teacher/students', icon: Users },
    { label: 'Attendance', path: '/teacher/attendance', icon: Calendar },
    { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { label: 'Syllabus', path: '/teacher/syllabus', icon: FileText },
  ],
  parent: [
    { label: 'Dashboard', path: '/parent/dashboard', icon: Home },
    { label: 'My Child', path: '/parent/child', icon: Users },
    { label: 'Attendance', path: '/parent/attendance', icon: Calendar },
    { label: 'Syllabus', path: '/parent/syllabus', icon: FileText },
    { label: 'Fees', path: '/parent/fees', icon: DollarSign },
    { label: 'Exam Results', path: '/parent/exam-results', icon: GraduationCap },
    { label: 'Announcements', path: '/parent/announcements', icon: Megaphone },
  ],
  super_admin: [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: Home },
    { label: 'Schools', path: '/super-admin/schools', icon: Building },
    { label: 'Create School', path: '/super-admin/create-school', icon: Plus },
  ],
};

export const getSidebarItems = (role?: string): SidebarItem[] => {
  return SIDEBAR_ITEMS[role as UserRole] ?? SIDEBAR_ITEMS.school_admin;
};
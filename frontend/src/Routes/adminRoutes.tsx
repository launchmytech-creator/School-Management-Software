import React from "react";
import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";
import AdminDashboard from "../Pages/Admin/Dashboard";
import AdminProfile from "../Pages/Admin/AdminProfile";
import AcademicYearsPage from "../Pages/Admin/AcademicYearsPage";
import Classes from "../Pages/Admin/Classes";
import ClassDetail from "../Pages/Admin/ClassDetail";
import ParentList from "../Pages/Admin/ParentList";
import StudentProfile from "../components/common/StudentProfile";
import StudentForm from "../components/common/StudentForm";
import StudentClassSelector from "../components/students/StudentClassSelector";
import StudentClassList from "../components/students/StudentClassList";
import TeacherList from "../Pages/Admin/TeacherList";
import TeacherAllocation from "../Pages/Admin/TeacherAllocation";
import TeacherProfile from "../Pages/Admin/TeacherProfile";
import AccountantList from "../Pages/Admin/AccountantList";
import AddAccountant from "../Pages/Admin/AddAccountant";
import EditAccountant from "../Pages/Admin/EditAccountant";
import AccountantProfile from "../Pages/Admin/AccountantProfile";
import FeeClassSelector from "../components/fee/FeeClassSelector";
import StudentFeeList from "../components/fee/StudentFeeList";
import StudentFeeDetail from "../components/fee/StudentFeeDetail";
import FeeClassDefaulters from "../components/fee/FeeClassDefaulters";
import FeeStructures from "../Pages/Admin/FeeStructures";
import ExamsList from "../components/common/ExamsList";
import ExamClassSelector from "../components/exam/ExamClassSelector";
import ExamResultsPage from "../components/exam/ExamResultsPage";
import SubjectResultsPage from "../components/exam/SubjectResultsPage";
import ClassSubjects from "../Pages/Admin/ClassSubjects";
import SubjectChapters from "../Pages/Admin/SubjectChapters";
import SyllabusTracking from "../Pages/Admin/SyllabusTracking";
import SyllabusSubjectProgress from "../Pages/Admin/SyllabusSubjectProgress";
import SyllabusChapterProgress from "../Pages/Admin/SyllabusChapterProgress";
import Holidays from "../Pages/Admin/Holidays";
import TeacherAttendancePage from "../Pages/Admin/TeacherAttendancePage";
import Announcements from "../components/common/Announcements";
import SchoolSettingsPage from "../Pages/Admin/SchoolSettingsPage";
import StudentPromotion from "../Pages/Admin/StudentPromotion";
import MarksEntry from "../components/common/MarksEntry";
import ClassComparison from "../Pages/Admin/ClassComparison";
import StudentHistory from "../Pages/Admin/StudentHistory";
import NotFound from "../Pages/NotFound";

const PlanGuard: React.FC<{ feature: string; children: React.ReactNode }> = ({
  feature,
  children,
}) => {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }
  return <>{children}</>;
};

const AdminRoutes = () => (
  <MainLayout>
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="academic-years" element={<AcademicYearsPage />} />
      <Route path="classes" element={<Classes />} />
      <Route
        path="classes/:id"
        element={
          <RequiresActiveYear>
            <ClassDetail />
          </RequiresActiveYear>
        }
      />
      <Route path="parents" element={<ParentList />} />

      {/* Student Management */}
      <Route
        path="students"
        element={
          <RequiresActiveYear>
            <StudentClassSelector layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="students/class/:classId"
        element={
          <RequiresActiveYear>
            <StudentClassList layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="add-student"
        element={
          <RequiresActiveYear>
            <StudentForm layout="admin" mode="create" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="students/:id"
        element={
          <RequiresActiveYear>
            <StudentProfile layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="students/:id/edit"
        element={
          <RequiresActiveYear>
            <StudentForm layout="admin" mode="edit" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="student-promotion"
        element={
          <RequiresActiveYear>
            <StudentPromotion />
          </RequiresActiveYear>
        }
      />
      <Route
        path="student-history"
        element={
          <RequiresActiveYear>
            <StudentHistory />
          </RequiresActiveYear>
        }
      />

      {/* Teacher Management */}
      <Route
        path="teachers"
        element={
          <RequiresActiveYear>
            <TeacherList />
          </RequiresActiveYear>
        }
      />
      <Route
        path="teacher-allocation"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="teacher_allocation">
              <TeacherAllocation />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />
      <Route
        path="teachers/:id"
        element={
          <RequiresActiveYear>
            <TeacherProfile />
          </RequiresActiveYear>
        }
      />

      {/* Accountant Management */}
      <Route
        path="accountants"
        element={
          <RequiresActiveYear>
            <AccountantList />
          </RequiresActiveYear>
        }
      />
      <Route
        path="add-accountant"
        element={
          <RequiresActiveYear>
            <AddAccountant />
          </RequiresActiveYear>
        }
      />
      <Route
        path="accountants/:id/edit"
        element={
          <RequiresActiveYear>
            <EditAccountant />
          </RequiresActiveYear>
        }
      />
      <Route
        path="accountants/:id"
        element={
          <RequiresActiveYear>
            <AccountantProfile />
          </RequiresActiveYear>
        }
      />

      {/* Fee Management */}
      <Route
        path="fees"
        element={
          <RequiresActiveYear>
            <FeeClassSelector mode="collection" layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fees/class/:classId"
        element={
          <RequiresActiveYear>
            <StudentFeeList layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fees/class/:classId/student/:studentId"
        element={
          <RequiresActiveYear>
            <StudentFeeDetail layout="admin" canApplyWaiver={true} canEdit={true} />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-defaulters"
        element={
          <RequiresActiveYear>
            <FeeClassSelector mode="defaulters" layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-defaulters/class/:classId"
        element={
          <RequiresActiveYear>
            <FeeClassDefaulters layout="admin" canSendReminders={true} />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-structures"
        element={
          <RequiresActiveYear>
            <FeeStructures />
          </RequiresActiveYear>
        }
      />

      {/* Examination */}
      <Route
        path="exams"
        element={
          <RequiresActiveYear>
            <ExamsList layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results"
        element={
          <RequiresActiveYear>
            <ExamClassSelector layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results/class/:classId"
        element={
          <RequiresActiveYear>
            <ExamResultsPage layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results/class/:classId/subject/:subjectId"
        element={
          <RequiresActiveYear>
            <SubjectResultsPage layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="marks-entry"
        element={
          <RequiresActiveYear>
            <MarksEntry layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="class-comparison"
        element={
          <RequiresActiveYear>
            <ClassComparison />
          </RequiresActiveYear>
        }
      />

      {/* Academic Management */}
      <Route
        path="classes/:id/subjects"
        element={
          <RequiresActiveYear>
            <ClassSubjects />
          </RequiresActiveYear>
        }
      />
      <Route
        path="classes/:id/subjects/:subjectId/chapters"
        element={
          <RequiresActiveYear>
            <SubjectChapters />
          </RequiresActiveYear>
        }
      />
      <Route
        path="syllabus-tracking"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="syllabus_tracking">
              <SyllabusTracking />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />
      <Route
        path="syllabus-tracking/class/:classId"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="syllabus_tracking">
              <SyllabusSubjectProgress />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />
      <Route
        path="syllabus-tracking/class/:classId/subject/:subjectId"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="syllabus_tracking">
              <SyllabusChapterProgress />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />
      <Route
        path="holidays"
        element={
          <RequiresActiveYear>
            <Holidays />
          </RequiresActiveYear>
        }
      />

      {/* Teacher Attendance */}
      <Route
        path="teacher-attendance"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="attendance">
              <TeacherAttendancePage />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />

      {/* Announcements */}
      <Route
        path="announcements"
        element={
          <RequiresActiveYear>
            <Announcements layout="admin" />
          </RequiresActiveYear>
        }
      />

      {/* Settings */}
      <Route path="school-settings" element={<SchoolSettingsPage />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </MainLayout>
);

export default AdminRoutes;

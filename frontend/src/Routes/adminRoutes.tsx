import React from "react";
import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../Pages/Admin/Dashboard";
import AdminProfile from "../Pages/Admin/AdminProfile";
import AcademicYearsPage from "../Pages/Admin/AcademicYearsPage";
import Classes from "../Pages/Admin/Classes";
import ClassDetail from "../Pages/Admin/ClassDetail";
import ParentList from "../Pages/Admin/ParentList";
import AddStudent from "../Pages/Admin/AddStudent";
import EditStudent from "../Pages/Admin/EditStudent";
import StudentProfile from "../components/common/StudentProfile";
import StudentsList from "../components/common/StudentsList";
import TeacherList from "../Pages/Admin/TeacherList";
import TeacherAllocation from "../Pages/Admin/TeacherAllocation";
import TeacherProfile from "../Pages/Admin/TeacherProfile";
import AccountantList from "../Pages/Admin/AccountantList";
import AddAccountant from "../Pages/Admin/AddAccountant";
import EditAccountant from "../Pages/Admin/EditAccountant";
import AccountantProfile from "../Pages/Admin/AccountantProfile";
import FeeCollection from "../Pages/Admin/FeeCollection";
import FeeDefaulters from "../Pages/Admin/FeeDefaulters";
import ExamsList from "../components/common/ExamsList";
import ExamResults from "../components/common/ExamResults";
import Subjects from "../Pages/Admin/Subjects";
import SyllabusTracking from "../Pages/Admin/SyllabusTracking";
import Holidays from "../Pages/Admin/Holidays";
import TeacherAttendancePage from "../Pages/Admin/TeacherAttendancePage";
import Announcements from "../Pages/Admin/Announcements";
import SchoolSettingsPage from "../Pages/Admin/SchoolSettingsPage";
import StudentPromotion from "../Pages/Admin/StudentPromotion";
import FeeStructures from "../Pages/Admin/FeeStructures";
import MarksEntry from "../components/common/MarksEntry";
import Reports from "@/Pages/Admin/Reports";
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
  <AdminLayout>
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
            <StudentsList layout="admin" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="add-student"
        element={
          <RequiresActiveYear>
            <AddStudent />
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
            <EditStudent />
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
            <FeeCollection />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-defaulters"
        element={
          <RequiresActiveYear>
            <FeeDefaulters />
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
            <ExamResults layout="admin" />
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
        path="subjects"
        element={
          <RequiresActiveYear>
            <Subjects />
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
            <Announcements />
          </RequiresActiveYear>
        }
      />

      {/* Reports */}
      <Route
        path="reports"
        element={
          <RequiresActiveYear>
            <PlanGuard feature="analytics">
              <Reports />
            </PlanGuard>
          </RequiresActiveYear>
        }
      />

      {/* Settings */}
      <Route path="school-settings" element={<SchoolSettingsPage />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AdminLayout>
);

export default AdminRoutes;

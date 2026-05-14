import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import UpgradePrompt from "../components/common/UpgradePrompt";
import MainLayout from "../layouts/MainLayout";
import StudentClassSelector from "../components/students/StudentClassSelector";
import StudentClassList from "../components/students/StudentClassList";
import StudentProfile from "../components/common/StudentProfile";
import StudentForm from "../components/common/StudentForm";
import FeeClassSelector from "../components/fee/FeeClassSelector";
import StudentFeeList from "../components/fee/StudentFeeList";
import StudentFeeDetail from "../components/fee/StudentFeeDetail";
import FeeClassDefaulters from "../components/fee/FeeClassDefaulters";
import AccountantFeeStructures from "../Pages/Accountant/FeeStructures";
import ExamsList from "../components/common/ExamsList";
import ExamClassSelector from "../components/exam/ExamClassSelector";
import ExamResultsPage from "../components/exam/ExamResultsPage";
import SubjectResultsPage from "../components/exam/SubjectResultsPage";
import MarksEntry from "../components/common/MarksEntry";
import StudentAttendance from "../components/common/StudentAttendance";
import StudentHistory from "../Pages/Admin/StudentHistory";
import AccountantDashboard from "../Pages/Accountant/Dashboard";
import Announcements from "../components/common/Announcements";
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

const AccountantRoutes = () => (
  <MainLayout>
    <Routes>
      <Route path="dashboard" element={<AccountantDashboard />} />

      {/* Fee Management */}
      <Route
        path="fees"
        element={
          <RequiresActiveYear>
            <FeeClassSelector mode="collection" layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fees/class/:classId"
        element={
          <RequiresActiveYear>
            <StudentFeeList layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fees/class/:classId/student/:studentId"
        element={
          <RequiresActiveYear>
            <StudentFeeDetail layout="accountant" canApplyWaiver={false} canEdit={false} />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-defaulters"
        element={
          <RequiresActiveYear>
            <FeeClassSelector mode="defaulters" layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="fee-defaulters/class/:classId"
        element={
          <RequiresActiveYear>
            <FeeClassDefaulters layout="accountant" canSendReminders={false} />
          </RequiresActiveYear>
        }
      />

      {/* Student Management */}
      <Route
        path="students"
        element={
          <RequiresActiveYear>
            <StudentClassSelector layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="students/class/:classId"
        element={
          <RequiresActiveYear>
            <StudentClassList layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route path="add-student" element={<StudentForm layout="accountant" mode="create" />} />
      <Route path="students/:id" element={<StudentProfile layout="accountant" />} />
      <Route path="students/:id/edit" element={<StudentForm layout="accountant" mode="edit" />} />

      <Route
        path="attendance"
        element={
          <PlanGuard feature="attendance">
            <RequiresActiveYear>
              <StudentAttendance layout="accountant" />
            </RequiresActiveYear>
          </PlanGuard>
        }
      />
      <Route path="fee-structures" element={<AccountantFeeStructures />} />
      <Route path="announcements" element={<Announcements layout="accountant" />} />
      <Route
        path="exams"
        element={
          <RequiresActiveYear>
            <ExamsList layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results"
        element={
          <RequiresActiveYear>
            <ExamClassSelector layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results/class/:classId"
        element={
          <RequiresActiveYear>
            <ExamResultsPage layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="exam-results/class/:classId/subject/:subjectId"
        element={
          <RequiresActiveYear>
            <SubjectResultsPage layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="marks-entry"
        element={
          <RequiresActiveYear>
            <MarksEntry layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route
        path="subjects"
        element={
          <RequiresActiveYear>
            <StudentHistory />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  </MainLayout>
);

export default AccountantRoutes;

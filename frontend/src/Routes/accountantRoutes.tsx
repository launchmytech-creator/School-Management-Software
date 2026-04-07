import React from "react";
import { Routes, Route } from "react-router-dom";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import AccountantDashboard from "../Pages/Accountant/Dashboard";
import AccountantFeeCollection from "../Pages/Accountant/FeeCollection";
import AccountantFeeDefaulters from "../Pages/Accountant/FeeDefaulters";
import AccountantFeeStructures from "../Pages/Accountant/FeeStructures";
import AccountantAnnouncements from "../Pages/Accountant/Announcements";
import AddStudent from "../Pages/Accountant/AddStudent";
import AccountantStudentProfile from "../Pages/Accountant/StudentProfile";
import AccountantEditStudent from "../Pages/Accountant/EditStudent";
import AccountantLayout from "../layouts/AccountantLayout";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import StudentsList from "../components/common/StudentsList";
import ExamsList from "../components/common/ExamsList";
import ExamResults from "../components/common/ExamResults";
import MarksEntry from "../components/common/MarksEntry";
import StudentAttendance from "../components/common/StudentAttendance";

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
  <AccountantLayout>
    <Routes>
      <Route path="dashboard" element={<AccountantDashboard />} />
      <Route path="fees" element={<AccountantFeeCollection />} />
      <Route path="fee-defaulters" element={<AccountantFeeDefaulters />} />
      <Route
        path="students"
        element={
          <RequiresActiveYear>
            <StudentsList layout="accountant" />
          </RequiresActiveYear>
        }
      />
      <Route path="add-student" element={<AddStudent />} />
      <Route path="students/:id" element={<AccountantStudentProfile />} />
      <Route path="students/:id/edit" element={<AccountantEditStudent />} />
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
      <Route path="announcements" element={<AccountantAnnouncements />} />
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
            <ExamResults layout="accountant" />
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
    </Routes>
  </AccountantLayout>
);

export default AccountantRoutes;

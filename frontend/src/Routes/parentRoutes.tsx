import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UpgradePrompt from "../components/common/UpgradePrompt";
import MainLayout from "../layouts/MainLayout";
import { SelectedChildProvider } from "../context/SelectedChildContext";
import ParentDashboard from "../Pages/Parent/Dashboard";
import ParentAttendance from "../Pages/Parent/Attendance";
import SyllabusSubjectProgress from "../Pages/Parent/SyllabusSubjectProgress";
import SyllabusChapterProgress from "../Pages/Parent/SyllabusChapterProgress";
import ParentFeeStatus from "../Pages/Parent/FeeStatus";
import ParentExamResults from "../Pages/Parent/ExamResults";
import Announcements from "../components/common/Announcements";
import NotFound from "../Pages/NotFound";

const PlanGuard: React.FC<{ feature: string; children: React.ReactNode }> = ({ feature, children }) => {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }
  return <>{children}</>;
};

const ParentRoutes = () => (
  <MainLayout>
    <SelectedChildProvider>
      <Routes>
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="attendance" element={<PlanGuard feature="attendance"><ParentAttendance /></PlanGuard>} />
        <Route path="syllabus" element={<SyllabusSubjectProgress />} />
        <Route path="syllabus/subject/:subjectId" element={<SyllabusChapterProgress />} />
        <Route path="fees" element={<ParentFeeStatus />} />
        <Route path="exam-results" element={<ParentExamResults />} />
        <Route path="announcements" element={<Announcements layout="parent" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SelectedChildProvider>
  </MainLayout>
);

export default ParentRoutes;
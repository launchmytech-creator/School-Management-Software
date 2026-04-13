import React from "react";
import { Routes, Route } from "react-router-dom";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import ParentDashboard from "../Pages/Parent/Dashboard";
import ParentAttendance from "../Pages/Parent/Attendance";
import ParentSyllabus from "../Pages/Parent/Syllabus";
import ParentFeeStatus from "../Pages/Parent/FeeStatus";
import ParentExamResults from "@/Pages/Parent/ExamResults";
import ParentAnnouncements from "../Pages/Parent/Announcements";
import ParentLayout from "../layouts/ParentLayout";
import NotFound from "../Pages/NotFound";

const PlanGuard: React.FC<{ feature: string; children: React.ReactNode }> = ({ feature, children }) => {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }
  return <>{children}</>;
};

const ParentRoutes = () => (
  <ParentLayout>
    <Routes>
      <Route path="dashboard" element={<ParentDashboard />} />
      <Route path="attendance" element={<PlanGuard feature="attendance"><ParentAttendance /></PlanGuard>} />
      <Route path="syllabus" element={<ParentSyllabus />} />
      <Route path="fees" element={<ParentFeeStatus />} />
      <Route path="exam-results" element={<ParentExamResults />} />
      <Route path="announcements" element={<ParentAnnouncements />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </ParentLayout>
);

export default ParentRoutes;

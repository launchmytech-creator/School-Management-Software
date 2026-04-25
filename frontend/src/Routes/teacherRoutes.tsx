import React from "react";
import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../Pages/Teacher/Dashboard";
import TeacherSyllabus from "../Pages/Teacher/Syllabus";
import TeacherAnnouncements from "../Pages/Teacher/Announcements";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentAttendance from "../components/common/StudentAttendance";
import TeacherStudentList from "../Pages/Teacher/StudentList";
import TeacherStudentProfile from "../Pages/Teacher/StudentProfile";
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

const TeacherRoutes = () => (
  <TeacherLayout>
    <Routes>
      <Route path="dashboard" element={<TeacherDashboard />} />
      <Route
        path="syllabus"
        element={
          <PlanGuard feature="syllabus_tracking">
            <RequiresActiveYear>
              <TeacherSyllabus isEditable={true} />
            </RequiresActiveYear>
          </PlanGuard>
        }
      />
      <Route
        path="students"
        element={
          <RequiresActiveYear>
            <TeacherStudentList />
          </RequiresActiveYear>
        }
      />
      <Route
        path="attendance"
        element={
          <PlanGuard feature="attendance">
            <RequiresActiveYear>
              <StudentAttendance layout="teacher" />
            </RequiresActiveYear>
          </PlanGuard>
        }
      />
      <Route path="announcements" element={<TeacherAnnouncements />} />
      <Route path="students/:id" element={<TeacherStudentProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TeacherLayout>
);

export default TeacherRoutes;

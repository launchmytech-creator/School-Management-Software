import React, { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import UpgradePrompt from "../components/common/UpgradePrompt";
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../Pages/Teacher/Dashboard";
import TeacherSyllabus from "../Pages/Teacher/Syllabus";
import Announcements from "../components/common/Announcements";
import MainLayout from "../layouts/MainLayout";
import StudentClassSelector from "../components/students/StudentClassSelector";
import StudentClassList from "../components/students/StudentClassList";
import StudentProfile from "../components/common/StudentProfile";
import StudentAttendance from "../components/common/StudentAttendance";
import { useTeacherAllocations } from "../hooks/queries/useTeachers";
import { useAcademicYear } from "../context/AcademicYearContext";
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

const TeacherStudentSelector: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { data: allocations = [] } = useTeacherAllocations(
    user?.id as number,
    selectedYear?.id ? Number(selectedYear?.id) : undefined,
  );

  const teacherClassIds = useMemo(() => {
    return new Set<string>(allocations.map((a) => String(a.classId)));
  }, [allocations]);

  return (
    <RequiresActiveYear>
      <StudentClassSelector layout="teacher" teacherClassIds={teacherClassIds} />
    </RequiresActiveYear>
  );
};

const TeacherRoutes = () => (
  <MainLayout>
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
      <Route path="students" element={<TeacherStudentSelector />} />
      <Route
        path="students/class/:classId"
        element={
          <RequiresActiveYear>
            <StudentClassList layout="teacher" />
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
      <Route path="announcements" element={<Announcements layout="teacher" />} />
      <Route path="students/:id" element={<StudentProfile layout="teacher" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </MainLayout>
);

export default TeacherRoutes;

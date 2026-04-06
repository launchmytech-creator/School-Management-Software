import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import TeacherDashboard from "../Pages/Teacher/Dashboard";
import StudentAttendance from "../Pages/Teacher/StudentAttendance";
import TeacherSyllabus from "../Pages/Teacher/Syllabus";
import TeacherAnnouncements from "../Pages/Teacher/Announcements";

const withActiveYear = (element: React.ReactElement) => (
  <RequiresActiveYear>{element}</RequiresActiveYear>
);

const TeacherRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<TeacherDashboard />} />
    <Route path="my-classes" element={withActiveYear(<TeacherSyllabus customTitle="My Classes" isEditable={true} />)} />
    <Route path="attendance" element={withActiveYear(<StudentAttendance />)} />
    <Route path="syllabus" element={withActiveYear(<TeacherSyllabus />)} />
    <Route path="announcements" element={<TeacherAnnouncements />} />
  </Routes>
);

export default TeacherRoutes;

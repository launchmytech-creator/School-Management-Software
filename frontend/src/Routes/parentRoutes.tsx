import { Routes, Route } from "react-router-dom";
import ParentDashboard from "../Pages/Parent/Dashboard";
import ParentAttendance from "../Pages/Parent/Attendance";
import ParentSyllabus from "../Pages/Parent/Syllabus";
import ParentFeeStatus from "../Pages/Parent/FeeStatus";
import ParentExamResults from "@/Pages/Parent/ExamResults";

const ParentRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<ParentDashboard />} />
    <Route path="attendance" element={<ParentAttendance />} />
    <Route path="syllabus" element={<ParentSyllabus />} />
    <Route path="fees" element={<ParentFeeStatus />} />
    <Route path="exam-results" element={<ParentExamResults />} />
  </Routes>
);

export default ParentRoutes;

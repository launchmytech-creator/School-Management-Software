import { Routes, Route } from "react-router-dom";
import ParentDashboard from "../Pages/Parent/Dashboard";
import ParentAttendance from "../Pages/Parent/Attendance";
import ParentSyllabus from "../Pages/Parent/Syllabus";
import ParentFeeStatus from "../Pages/Parent/FeeStatus";

const parentRoutes = (
  <Routes>
    <Route path="dashboard" element={<ParentDashboard />} />
    <Route path="attendance" element={<ParentAttendance />} />
    <Route path="syllabus" element={<ParentSyllabus />} />
    <Route path="fees" element={<ParentFeeStatus />} />
  </Routes>
);

export default parentRoutes;

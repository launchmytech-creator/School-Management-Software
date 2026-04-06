import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import AccountantDashboard from "../Pages/Accountant/Dashboard";
import AccountantFeeCollection from "../Pages/Accountant/FeeCollection";
import AccountantFeeDefaulters from "../Pages/Accountant/FeeDefaulters";
import AccountantStudents from "../Pages/Accountant/Students";
import AccountantFeeStructures from "../Pages/Accountant/FeeStructures";
import AccountantAnnouncements from "../Pages/Accountant/Announcements";
import AddStudent from "../Pages/Accountant/AddStudent";
import AccountantAttendance from "../Pages/Accountant/Attendance";
import AccountantStudentProfile from "../Pages/Accountant/StudentProfile";
import AccountantEditStudent from "../Pages/Accountant/EditStudent";
import AccountantExams from "../Pages/Accountant/Exams";
import AccountantExamResults from "../Pages/Accountant/ExamResults";
import AccountantMarksEntry from "../Pages/Accountant/MarksEntry";

const withActiveYear = (element: React.ReactElement) => (
  <RequiresActiveYear>{element}</RequiresActiveYear>
);

const AccountantRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<AccountantDashboard />} />
    <Route path="fees" element={<AccountantFeeCollection />} />
    <Route path="fee-defaulters" element={<AccountantFeeDefaulters />} />
    <Route path="students" element={<AccountantStudents />} />
    <Route path="add-student" element={<AddStudent />} />
    <Route path="students/:id" element={<AccountantStudentProfile />} />
    <Route path="students/:id/edit" element={<AccountantEditStudent />} />
    <Route path="attendance" element={<AccountantAttendance />} />
    <Route path="fee-structures" element={<AccountantFeeStructures />} />
    <Route path="announcements" element={<AccountantAnnouncements />} />
    <Route path="exams" element={<AccountantExams />} />
    <Route path="exam-results" element={<AccountantExamResults />} />
    <Route path="marks-entry" element={<AccountantMarksEntry />} />
  </Routes>
);

export default AccountantRoutes;

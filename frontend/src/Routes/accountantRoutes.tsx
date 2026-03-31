import { Routes, Route } from "react-router-dom";
import AccountantDashboard from "../Pages/Accountant/Dashboard";
import AccountantFeeCollection from "../Pages/Accountant/FeeCollection";
import AccountantFeeDefaulters from "../Pages/Accountant/FeeDefaulters";
import FinancialReports from "../Pages/Accountant/FinancialReports";
import AccountantStudents from "../Pages/Accountant/Students";
import AccountantFeeStructures from "../Pages/Accountant/FeeStructures";
import AccountantAnnouncements from "../Pages/Accountant/Announcements";

const accountantRoutes = (
  <Routes>
    <Route path="dashboard" element={<AccountantDashboard />} />
    <Route path="fees" element={<AccountantFeeCollection />} />
    <Route path="fee-defaulters" element={<AccountantFeeDefaulters />} />
    <Route path="reports" element={<FinancialReports />} />
    <Route path="students" element={<AccountantStudents />} />
    <Route path="fee-structures" element={<AccountantFeeStructures />} />
    <Route path="announcements" element={<AccountantAnnouncements />} />
  </Routes>
);

export default accountantRoutes;

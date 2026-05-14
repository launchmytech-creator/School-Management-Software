import { Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "../Pages/superAdmin/Dashboard";
import Schools from "../Pages/superAdmin/Schools";
import CreateSchool from "../Pages/superAdmin/CreateSchool";
import SchoolDetail from "../Pages/superAdmin/SchoolDetail";
import PricingManagement from "../Pages/superAdmin/PricingManagement";
import NotFound from "../Pages/NotFound";

const SuperAdminRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<SuperAdminDashboard />} />
    <Route path="schools" element={<Schools />} />
    <Route path="schools/:id" element={<SchoolDetail />} />
    <Route path="create-school" element={<CreateSchool />} />
    <Route path="pricing" element={<PricingManagement />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default SuperAdminRoutes;

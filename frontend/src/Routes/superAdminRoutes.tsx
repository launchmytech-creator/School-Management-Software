import { Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "../Pages/superAdmin/Dashboard";
import Schools from "../Pages/superAdmin/Schools";
import CreateSchool from "../Pages/superAdmin/CreateSchool";

const SuperAdminRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<SuperAdminDashboard />} />
    <Route path="schools" element={<Schools />} />
    <Route path="create-school" element={<CreateSchool />} />
  </Routes>
);

export default SuperAdminRoutes;

import { Routes, Route } from "react-router-dom";
import { SchoolProvider } from "../context/SchoolContext";
import SuperAdminDashboard from "../Pages/superAdmin/Dashboard";
import Schools from "../Pages/superAdmin/Schools";
import CreateSchool from "../Pages/superAdmin/CreateSchool";

const superAdminRoutes = (
  <SchoolProvider>
    <Routes>
      <Route path="dashboard" element={<SuperAdminDashboard />} />
      <Route path="schools" element={<Schools />} />
      <Route path="create-school" element={<CreateSchool />} />
    </Routes>
  </SchoolProvider>
);

export default superAdminRoutes;

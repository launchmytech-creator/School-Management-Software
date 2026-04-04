import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import AdminDashboard from "../Pages/Admin/Dashboard";
import AcademicYearsPage from "../Pages/Admin/AcademicYearsPage";
import Classes from "../Pages/Admin/Classes";
import ClassDetail from "../Pages/Admin/ClassDetail";
import ParentList from "../Pages/Admin/ParentList";
import Students from "../Pages/Admin/Students";
import AddStudent from "../Pages/Admin/AddStudent";
import EditStudent from "../Pages/Admin/EditStudent";
import StudentProfile from "../components/common/StudentProfile";
import TeacherList from "../Pages/Admin/TeacherList";
import TeacherAllocation from "../Pages/Admin/TeacherAllocation";
import TeacherProfile from "../Pages/Admin/TeacherProfile";
import AccountantList from "../Pages/Admin/AccountantList";
import AddAccountant from "../Pages/Admin/AddAccountant";
import EditAccountant from "../Pages/Admin/EditAccountant";
import AccountantProfile from "../Pages/Admin/AccountantProfile";
import FeeCollection from "../Pages/Admin/FeeCollection";
import FeeDefaulters from "../Pages/Admin/FeeDefaulters";
import Exams from "../Pages/Admin/Exams";
import ExamResults from "../Pages/Admin/ExamResults";
import Subjects from "../Pages/Admin/Subjects";
import Chapters from "../Pages/Admin/Chapters";
import ClassSubjects from "../Pages/Admin/ClassSubjects";
import SyllabusTracking from "../Pages/Admin/SyllabusTracking";
import Holidays from "../Pages/Admin/Holidays";
import TeacherAttendancePage from "../Pages/Admin/TeacherAttendancePage";
import Announcements from "../Pages/Admin/Announcements";
import Timetables from "../Pages/Admin/Timetables";
import SchoolSettingsPage from "../Pages/Admin/SchoolSettingsPage";

const StudentPromotion = lazy(() => import("../Pages/Admin/StudentPromotion"));
const FeeStructures = lazy(() => import("../Pages/Admin/FeeStructures"));
const MarksEntry = lazy(() => import("../Pages/Admin/MarksEntry"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" message="Loading..." />
  </div>
);

const withActiveYear = (element: React.ReactElement) => (
  <RequiresActiveYear>{element}</RequiresActiveYear>
);

const AdminRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="academic-years" element={<AcademicYearsPage />} />
    <Route path="classes" element={<Classes />} />
    <Route path="classes/:id" element={withActiveYear(<ClassDetail />)} />
    <Route path="parents" element={<ParentList />} />

    {/* Student Management */}
    <Route path="students" element={withActiveYear(<Students />)} />
    <Route path="add-student" element={withActiveYear(<AddStudent />)} />
    <Route path="students/:id" element={withActiveYear(<StudentProfile layout="admin" />)} />
    <Route path="students/:id/edit" element={withActiveYear(<EditStudent />)} />
    <Route
      path="student-promotion"
      element={withActiveYear(<Suspense fallback={<PageLoader />}><StudentPromotion /></Suspense>)}
    />

    {/* Teacher Management */}
    <Route path="teachers" element={ withActiveYear(<TeacherList />)} />
    <Route
      path="teacher-allocation"
      element={withActiveYear(<TeacherAllocation />)}
    />
    <Route path="teachers/:id" element={withActiveYear(<TeacherProfile />)} />

    {/* Accountant Management */}
    <Route path="accountants" element={ withActiveYear(<AccountantList />)} />
    <Route path="add-accountant" element={withActiveYear(<AddAccountant />)} />
    <Route
      path="accountants/:id/edit"
      element={withActiveYear(<EditAccountant />)}
    />
    <Route
      path="accountants/:id"
      element={withActiveYear(<AccountantProfile />)}
    />

    {/* Fee Management */}
    <Route path="fees" element={withActiveYear(<FeeCollection />)} />
    <Route path="fee-defaulters" element={withActiveYear(<FeeDefaulters />)} />
    <Route 
      path="fee-structures" 
      element={withActiveYear(<Suspense fallback={<PageLoader />}><FeeStructures /></Suspense>)} 
    />

    {/* Examination */}
    <Route path="exams" element={withActiveYear(<Exams />)} />
    <Route path="exam-results" element={withActiveYear(<ExamResults />)} />
    <Route 
      path="marks-entry" 
      element={withActiveYear(<Suspense fallback={<PageLoader />}><MarksEntry /></Suspense>)} 
    />

    {/* Academic Management */}
    <Route path="subjects" element={withActiveYear(<Subjects />)} />
    <Route
      path="subjects/:subjectId/chapters"
      element={withActiveYear(<Chapters />)}
    />
    <Route path="class-subjects" element={withActiveYear(<ClassSubjects />)} />
    <Route
      path="syllabus-tracking"
      element={ withActiveYear(<SyllabusTracking />)}
    />
    <Route path="holidays" element={withActiveYear(<Holidays />)} />

    {/* Teacher Attendance */}
    <Route
      path="teacher-attendance"
      element={withActiveYear(<TeacherAttendancePage />)}
    />

    {/* Announcements & Timetables */}
    <Route path="announcements" element={withActiveYear(<Announcements />)} />
    <Route path="timetables" element={withActiveYear(<Timetables />)} />

    {/* Settings */}
    <Route
      path="school-settings"
      element={withActiveYear(<SchoolSettingsPage />)}
    />
  </Routes>
);

export default AdminRoutes;

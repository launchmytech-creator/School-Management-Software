import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Register";
import SuperAdminDashboard from "../Pages/superAdmin/Dashboard";
import Schools from "../Pages/superAdmin/Schools";
import AdminDashboard from "../Pages/Admin/Dashboard";
import AccountantDashboard from "../Pages/Accountant/Dashboard";
import AccountantFeeCollection from "../Pages/Accountant/FeeCollection";
import AccountantFeeDefaulters from "../Pages/Accountant/FeeDefaulters";
import FinancialReports from "../Pages/Accountant/FinancialReports";
import AccountantStudents from "../Pages/Accountant/Students";
import TeacherDashboard from "../Pages/Teacher/Dashboard";
import TeacherMyClasses from "../Pages/Teacher/MyClasses";
import StudentAttendance from "../Pages/Teacher/StudentAttendance";
import TeacherSyllabus from "../Pages/Teacher/Syllabus";
import ParentDashboard from "../Pages/Parent/Dashboard";
import ParentAttendance from "../Pages/Parent/Attendance";
import ParentFeeStatus from "../Pages/Parent/FeeStatus";
import ParentSyllabus from "../Pages/Parent/Syllabus";
import CreateSchool from "../Pages/superAdmin/CreateSchool";
import Students from "../Pages/Admin/Students";
import AddStudent from "../Pages/Admin/AddStudent";
import StudentProfile from "../Pages/Admin/StudentProfile";
import AcademicYearsPage from "../Pages/Admin/AcademicYearsPage";
import Classes from "../Pages/Admin/Classes";
import ParentList from "../Pages/Admin/ParentList";
import RequiresActiveYear from "../components/academicYear/RequiresActiveYear";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import TeacherList from "../Pages/Admin/TeacherList";
import TeacherAllocation from "../Pages/Admin/TeacherAllocation";
import TeacherProfile from "../Pages/Admin/TeacherProfile";
import AccountantList from "../Pages/Admin/AccountantList";
import AccountantProfile from "../Pages/Admin/AccountantProfile";
import AddAccountant from "../Pages/Admin/AddAccountant";
import EditAccountant from "../Pages/Admin/EditAccountant";

// import Attendance from "../Pages/Admin/Attendance";
import FeeCollection from "../Pages/Admin/FeeCollection";
import FeeDefaulters from "../Pages/Admin/FeeDefaulters";
import FeeStructures from "../Pages/Admin/FeeStructures";
import Exams from "../Pages/Admin/Exams";
import ExamResults from "../Pages/Admin/ExamResults";
import MarksEntry from "../Pages/Admin/MarksEntry";
import Subjects from "../Pages/Admin/Subjects";
import Chapters from "../Pages/Admin/Chapters";
import ClassSubjects from "../Pages/Admin/ClassSubjects";
import SyllabusTracking from "../Pages/Admin/SyllabusTracking";
import Holidays from "../Pages/Admin/Holidays";
import StudentPromotion from "../Pages/Admin/StudentPromotion";
import * as TeacherAttendancePageComponent from "../Pages/Admin/TeacherAttendancePage";
import Announcements from "../Pages/Admin/Announcements";
import Timetables from "../Pages/Admin/Timetables";
// import Assignments from "../Pages/Admin/Assignments";
import SchoolSettingsPage from "../Pages/Admin/SchoolSettingsPage";
import Reports from "../Pages/Admin/Reports";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin/*"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="create-school" element={<CreateSchool />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* School Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["school_admin"]}>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="academic-years" element={<AcademicYearsPage />} />
              <Route path="classes" element={<Classes />} />
              <Route path="parents" element={<ParentList />} />

              {/* Student Management */}
              <Route
                path="students"
                element={
                  <RequiresActiveYear>
                    <Students />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="add-student"
                element={
                  <RequiresActiveYear>
                    <AddStudent />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="students/:id"
                element={
                  <RequiresActiveYear>
                    <StudentProfile />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="student-promotion"
                element={
                  <RequiresActiveYear>
                    <StudentPromotion />
                  </RequiresActiveYear>
                }
              />

              {/* Teacher Management */}
              <Route
                path="teachers"
                element={
                  <RequiresActiveYear>
                    <TeacherList />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="teacher-allocation"
                element={
                  <RequiresActiveYear>
                    <TeacherAllocation />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="teachers/:id"
                element={
                  <RequiresActiveYear>
                    <TeacherProfile />
                  </RequiresActiveYear>
                }
              />

              {/* Accountant Management */}
              <Route
                path="accountants"
                element={
                  <RequiresActiveYear>
                    <AccountantList />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="add-accountant"
                element={
                  <RequiresActiveYear>
                    <AddAccountant />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="accountants/:id/edit"
                element={
                  <RequiresActiveYear>
                    <EditAccountant />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="accountants/:id"
                element={
                  <RequiresActiveYear>
                    <AccountantProfile />
                  </RequiresActiveYear>
                }
              />

              {/* Attendance */}
              {/* <Route
                path="attendance"
                element={
                  <RequiresActiveYear>
                    <Attendance />
                  </RequiresActiveYear>
                }
              /> */}

              {/* Fee Management */}
              <Route
                path="fees"
                element={
                  <RequiresActiveYear>
                    <FeeCollection />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="fee-defaulters"
                element={
                  <RequiresActiveYear>
                    <FeeDefaulters />
                  </RequiresActiveYear>
                }
              />

              {/* Examination */}
              <Route
                path="exams"
                element={
                  <RequiresActiveYear>
                    <Exams />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="exam-results"
                element={
                  <RequiresActiveYear>
                    <ExamResults />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="marks-entry"
                element={
                  <RequiresActiveYear>
                    <MarksEntry />
                  </RequiresActiveYear>
                }
              />

              {/* Academic Management */}
              <Route
                path="subjects"
                element={
                  <RequiresActiveYear>
                    <Subjects />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="subjects/:subjectId/chapters"
                element={
                  <RequiresActiveYear>
                    <Chapters />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="class-subjects"
                element={
                  <RequiresActiveYear>
                    <ClassSubjects />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="syllabus-tracking"
                element={
                  <RequiresActiveYear>
                    <SyllabusTracking />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="holidays"
                element={
                  <RequiresActiveYear>
                    <Holidays />
                  </RequiresActiveYear>
                }
              />

              {/* Fee Management */}
              <Route
                path="fee-structures"
                element={
                  <RequiresActiveYear>
                    <FeeStructures />
                  </RequiresActiveYear>
                }
              />

              {/* Teacher Attendance */}
              <Route
                path="teacher-attendance"
                element={
                  <RequiresActiveYear>
                    <TeacherAttendancePageComponent.default />
                  </RequiresActiveYear>
                }
              />

              {/* New Modules */}
              <Route
                path="announcements"
                element={
                  <RequiresActiveYear>
                    <Announcements />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="timetables"
                element={
                  <RequiresActiveYear>
                    <Timetables />
                  </RequiresActiveYear>
                }
              />
              {/* <Route
                path="assignments"
                element={
                  <RequiresActiveYear>
                    <Assignments />
                  </RequiresActiveYear>
                }
              /> */}
              <Route
                path="reports"
                element={
                  <RequiresActiveYear>
                    <Reports />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="school-settings"
                element={
                  <RequiresActiveYear>
                    <SchoolSettingsPage />
                  </RequiresActiveYear>
                }
              />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Accountant Routes */}
      <Route
        path="/accountant/*"
        element={
          <ProtectedRoute allowedRoles={["accountant"]}>
            <Routes>
              <Route path="dashboard" element={<AccountantDashboard />} />
              <Route path="fees" element={<AccountantFeeCollection />} />
              <Route
                path="fee-defaulters"
                element={<AccountantFeeDefaulters />}
              />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="students" element={<AccountantStudents />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Routes>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route
                path="my-classes"
                element={
                  <RequiresActiveYear>
                    <TeacherMyClasses />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="attendance"
                element={
                  <RequiresActiveYear>
                    <StudentAttendance />
                  </RequiresActiveYear>
                }
              />
              <Route
                path="syllabus"
                element={
                  <RequiresActiveYear>
                    <TeacherSyllabus />
                  </RequiresActiveYear>
                }
              />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <Routes>
              <Route path="dashboard"  element={<ParentDashboard />} />
              <Route path="attendance" element={<ParentAttendance />} />
              <Route path="syllabus"  element={<ParentSyllabus />} />
              <Route path="fees"       element={<ParentFeeStatus />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;

import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useStudentById } from "../../hooks/queries/useStudents";
import { useAcademicYears } from "../../hooks/queries/useAcademicYears";
import { useHolidays } from "../../hooks/queries/useHolidays";
import { useAttendance } from "../../hooks/queries/useAttendance";
import { useStudentResults } from "../../hooks/queries/useExamResults";
import { useStudentFees } from "../../hooks/queries/useFeeTransactions";
import { type StudentResult } from "../../services/examResultService";
import { type FeeTransaction } from "../../services/feeService";
import { computeFeeSummary } from "../../lib/fee-utils";
import {
  subjectColor,
  gradeColor,
  progressColor,
  subjectIcon,
  EXAM_TYPES,
} from "../../lib/subject-utils";
import { useActivateStudent, useDeactivateStudent } from "../../hooks/mutations";
import { useAuth } from "../../context/AuthContext";
import type { Student } from "../../types/student";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import UpgradePrompt from "../../components/common/UpgradePrompt";
import PageHeader from "../../components/common/PageHeader";
import { getLocalDateString } from "../../lib/utils";
import { TabBar } from "../../components/ui";

interface StudentProfileProps {
  layout: "admin" | "accountant" | "teacher";
}

type AttendanceStatus = "present" | "absent" | "holiday" | "sunday" | "none";

interface CalendarDay {
  date: Date;
  dateStr: string;
  status: AttendanceStatus;
  isCurrentMonth: boolean;
  holiday?: { description: string } | undefined;
}

const SubjectCard: React.FC<{ result: StudentResult }> = ({ result }) => {
  const pct = Math.round((result.marksObtained / result.maxMarks) * 100);
  const { bar, label } = progressColor(pct);
  const { icon, bg, text } = subjectIcon(result.subjectName);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${text}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {result.subjectName}
            </h4>
            <p className="text-[11px] text-slate-400">
              Exam: {result.examName}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-black px-2 py-0.5 rounded-lg ${gradeColor(result.grade)}`}
        >
          {result.grade}
        </span>
      </div>
      <div className="mb-3">
        <span className="text-3xl font-black text-slate-900">
          {result.marksObtained}
        </span>
        <span className="text-sm text-slate-400 font-semibold">
          {" "}
          / {result.maxMarks}
        </span>
      </div>
      <div className="space-y-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Progress</span>
          <span className={bar.replace("bg-", "text-")}>{label}</span>
        </div>
      </div>
    </div>
  );
};

const StudentProfile: React.FC<StudentProfileProps> = ({ layout }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasFeature } = useAuth();
  
  const studentId = id ? parseInt(id) : 0;
  
  const { data: studentData, isLoading: loadingStudent } = useStudentById(studentId);
  const { data: academicYears = [] } = useAcademicYears();
  const [currentAcademicYear, setCurrentAcademicYear] = useState<{ name: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Attendance");
  const [activeSubject, setActiveSubject] = useState("Mathematics");
  const [activeType, setActiveType] = useState("All");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  React.useEffect(() => {
    const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
    setCurrentAcademicYear(current);
  }, [academicYears]);

  const { data: holidays = [] } = useHolidays(
    currentMonth.getFullYear()
  );

  const monthStart = useMemo(() => {
    return getLocalDateString(new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ));
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    return getLocalDateString(new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ));
  }, [currentMonth]);

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useAttendance({
    studentId,
    startDate: monthStart,
    endDate: monthEnd,
  });

  const { data: marksData = [], isLoading: loadingMarks } = useStudentResults(studentId);
  const { data: feeData = [], isLoading: loadingFee } = useStudentFees(studentId);

  const feeSummary = React.useMemo(
    () => computeFeeSummary(feeData as FeeTransaction[]),
    [feeData]
  );

  const activateStudent = useActivateStudent();
  const deactivateStudent = useDeactivateStudent();

  const student: Student | null = studentData ? {
    ...studentData,
    fullName: studentData.fullName || "Student",
    className: studentData.className || "Class",
    parentName: studentData.parentName || "Parent",
    phone: studentData.phone || "+1 234 567 890",
    status: studentData.status || "active",
  } : null;

  const handleDeactivate = async () => {
    if (!id) return;
    try {
      await deactivateStudent.mutateAsync(Number(id));
      navigate(`${basePath}/students`);
    } catch {
      // Error handled by mutation
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    try {
      await activateStudent.mutateAsync(Number(id));
      setShowDeactivateModal(false);
    } catch {
      // Error handled by mutation
    }
  };

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: CalendarDay[] = [];

    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        dateStr: getLocalDateString(date),
        status: "none",
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);
      const attendance = attendanceRecords.find(
        (r) => getLocalDateString(new Date(r.attendanceDate)) === dateStr,
      );
      const holiday = holidays.find((h) => h.holidayDate === dateStr);
      const isSunday = date.getDay() === 0;

      let status: AttendanceStatus = "none";
      if (holiday) {
        status = "holiday";
      } else if (isSunday) {
        status = "sunday";
      } else if (attendance?.status === "present") {
        status = "present";
      } else if (attendance?.status === "absent") {
        status = "absent";
      }

      days.push({
        date,
        dateStr,
        status,
        isCurrentMonth: true,
        holiday,
      });
    }

    return days;
  }, [currentMonth, attendanceRecords, holidays]);

  const attendanceSummary = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const totalDays = monthDays.length;
    const holidayCount = monthDays.filter((d) => d.status === "holiday").length;
    const sundayCount = monthDays.filter((d) => d.status === "sunday").length;
    const workingDays = totalDays - holidayCount - sundayCount;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present" || r.status === "late",
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "absent" || r.status === "excused",
    ).length;
    const percentage =
      workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;

    return {
      totalDays,
      holidayCount,
      sundayCount,
      workingDays,
      presentCount,
      absentCount,
      percentage,
    };
  }, [calendarDays, attendanceRecords]);

  const canGoPrev = useMemo(() => {
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    return prevMonth >= new Date(new Date().getFullYear() - 1, 0, 1);
  }, [currentMonth]);

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return nextMonth <= today;
  }, [currentMonth]);

  const prevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
      );
    }
  };

  const nextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
      );
    }
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleEdit = () => {
    navigate(`${basePath}/students/${id}/edit`);
  };

  const filteredMarks = marksData.filter(
    (r) => activeType === "All" || r.examType === activeType,
  );

  const latestBySubject = filteredMarks.reduce<Record<string, StudentResult>>(
    (acc, r) => {
      if (
        !acc[r.subjectName] ||
        new Date(r.examDate) > new Date(acc[r.subjectName].examDate)
      ) {
        acc[r.subjectName] = r;
      }
      return acc;
    },
    {},
  );
  const subjectCards = Object.values(latestBySubject);

  const allSubjects = [...new Set(marksData.map((r) => r.subjectName))];

  const trendData = (() => {
    const byExam: Record<string, Record<string, number | string>> = {};
    marksData.forEach((r) => {
      const key = r.examName;
      if (!byExam[key]) byExam[key] = { name: key };
      byExam[key][r.subjectName] = Math.round(
        (r.marksObtained / r.maxMarks) * 100,
      );
    });
    return Object.values(byExam);
  })();

  const isAdmin = layout === "admin";
  const isAccountant = layout === "accountant";
  const isTeacher = layout === "teacher";
  const basePath = isAdmin ? "/admin" : isAccountant ? "/accountant" : "/teacher";

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Student Profile"
        subtitle={student ? `${student.fullName} - ${student.className || 'N/A'}` : "View student details"}
        breadcrumb={{
          links: [
            { label: "People", href: `${basePath}/students` },
            { label: "Students", href: `${basePath}/students` },
            { label: "Profile", active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>

            <div className="relative inline-block mb-6">
              <div className="size-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.fullName}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`absolute bottom-1 right-1 size-6 border-4 border-white rounded-full ${
                student?.status === 'inactive' ? 'bg-rose-400' : 'bg-emerald-500'
              }`}></div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {student?.fullName}
            </h2>
            {student?.status === 'inactive' && (
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider mb-2">
                Inactive
              </div>
            )}
            <div className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-500 text-[11px] font-black rounded-full uppercase tracking-widest mb-2">
              {student?.className}
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">
              Academic Year: {currentAcademicYear?.name || "N/A"}
            </p>

            <div className="space-y-6 text-left border-t border-slate-50 pt-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    Parent
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {student?.parentName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    Phone
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {student?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    Email
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {student?.phone?.replace(/\D/g, "")}@email.com
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              {!isTeacher && (
                <button
                  onClick={handleEdit}
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Edit Profile
                </button>
              )}
              {isAdmin && (
                <>
                  {student?.status === 'inactive' ? (
                    <button
                      onClick={handleActivate}
                      disabled={activateStudent.isPending}
                      className="w-full py-3.5 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-black text-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activateStudent.isPending ? 'Activating...' : 'Activate Student'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowDeactivateModal(true)}
                      disabled={deactivateStudent.isPending}
                      className="w-full py-3.5 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deactivate Student
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-8">
          <TabBar
            tabs={[
              { key: "Attendance", label: "Attendance" },
              { key: "Marks", label: "Marks" },
              ...(!isTeacher ? [{ key: "Fee Status", label: "Fee Status" }] : []),
              { key: "Performance", label: "Performance" },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "Attendance" && (
            hasFeature("attendance") ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <CalendarDays size={20} className="text-blue-500" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {monthYear} Attendance
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prevMonth}
                      disabled={!canGoPrev}
                      className={`p-1 transition-colors ${canGoPrev ? "text-slate-300 hover:text-slate-600" : "text-slate-200 cursor-not-allowed"}`}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextMonth}
                      disabled={!canGoNext}
                      className={`p-1 transition-colors ${canGoNext ? "text-slate-300 hover:text-slate-600" : "text-slate-200 cursor-not-allowed"}`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-4">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (d) => (
                      <div
                        key={d}
                        className={`text-[10px] font-black text-center uppercase tracking-widest ${d === "SUN" ? "text-red-400" : "text-slate-300"}`}
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>

                {loadingAttendance ? (
                  <div className="h-64 flex items-center justify-center">
                    <LoadingSpinner size="md" message="Loading attendance..." />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-4">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all cursor-default relative ${
                          day.status === "present"
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : day.status === "absent"
                              ? "bg-rose-500 text-white shadow-md shadow-rose-500/10"
                              : day.status === "holiday"
                                ? "bg-amber-400 text-amber-900 shadow-md shadow-amber-400/10"
                                : day.status === "sunday"
                                  ? "bg-red-50 text-red-400 border border-red-100"
                                  : !day.isCurrentMonth
                                    ? "bg-transparent text-slate-200"
                                    : "bg-slate-50 text-slate-300"
                        }`}
                        title={
                          day.holiday?.description ||
                          (day.status === "sunday" ? "Sunday" : "")
                        }
                      >
                        <span>{day.date.getDate()}</span>
                        {day.status === "holiday" && day.holiday && (
                          <span className="text-[6px] font-bold mt-0.5 px-1 text-center leading-tight truncate max-w-full">
                            {day.holiday.description.length > 10
                              ? day.holiday.description.substring(0, 8) + ".."
                              : day.holiday.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-10 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-500">
                      Present ({attendanceSummary.presentCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-rose-500"></div>
                    <span className="text-slate-500">
                      Absent ({attendanceSummary.absentCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-amber-400"></div>
                    <span className="text-slate-500">
                      Holiday ({attendanceSummary.holidayCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-red-50 border border-red-200"></div>
                    <span className="text-slate-300">
                      Sunday ({attendanceSummary.sundayCount})
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">
                  Attendance Summary
                </h3>

                <div className="relative w-48 h-48 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Present",
                            value: attendanceSummary.presentCount,
                            color: "#10B981",
                          },
                          {
                            name: "Absent",
                            value: Math.max(
                              0,
                              attendanceSummary.workingDays -
                                attendanceSummary.presentCount,
                            ),
                            color: "#F1F5F9",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#F1F5F9" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-800 tracking-tight">
                      {attendanceSummary.percentage}%
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Attendance
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                    <span className="text-xs font-bold text-emerald-600">
                      Working Days
                    </span>
                    <span className="text-lg font-black text-emerald-700">
                      {attendanceSummary.workingDays}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                    <span className="text-xs font-bold text-rose-600">
                      Present Days
                    </span>
                    <span className="text-lg font-black text-rose-700">
                      {attendanceSummary.presentCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">
                      Absent Days
                    </span>
                    <span className="text-lg font-black text-slate-700">
                      {attendanceSummary.absentCount}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
                  {student?.fullName?.split(" ")[0]} has{" "}
                  {attendanceSummary.percentage >= 90
                    ? "excellent"
                    : attendanceSummary.percentage >= 75
                      ? "good"
                      : "needs improvement"}{" "}
                  attendance this month.
                </p>
              </div>
            </div>
            ) : (
              <UpgradePrompt feature="attendance" />
            )
          )}

          {activeTab !== "Attendance" && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              {activeTab === "Marks" && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Award size={24} className="text-blue-500" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Academic Performance
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    {EXAM_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveType(t)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          activeType === t
                            ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {loadingMarks ? (
                    <div className="flex items-center justify-center h-48">
                      <LoadingSpinner size="md" message="Loading marks..." />
                    </div>
                  ) : subjectCards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {subjectCards.map((r) => (
                        <SubjectCard key={r.id} result={r} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award
                        size={48}
                        className="mx-auto text-slate-300 mb-4"
                      />
                      <p className="text-slate-500">No exam results found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Performance" && (
                hasFeature("analytics") ? (
                <div className="space-y-6">
                  {loadingMarks ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex items-center justify-center">
                      <LoadingSpinner size="md" message="Loading performance data..." />
                    </div>
                  ) : trendData.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <h3 className="font-bold text-slate-900 mb-1">
                        Performance Trend
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                        Academic progress over recent examinations
                      </p>

                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={trendData}
                            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                            />
                            <Tooltip formatter={(val: number) => [`${val}%`]} />
                            {allSubjects.map((sub) => (
                              <Line
                                key={sub}
                                type="monotone"
                                dataKey={sub}
                                stroke={subjectColor(sub)}
                                strokeWidth={activeSubject === sub ? 3 : 1.5}
                                dot={{ r: activeSubject === sub ? 5 : 3 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-center gap-4 mt-4 flex-wrap">
                        {allSubjects.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setActiveSubject(sub)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                              activeSubject === sub
                                ? "text-white"
                                : "text-slate-500 bg-slate-100"
                            }`}
                            style={
                              activeSubject === sub
                                ? { backgroundColor: subjectColor(sub) }
                                : {}
                            }
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subjectColor(sub) }}
                            />
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                      <Award
                        size={48}
                        className="mx-auto text-slate-300 mb-4"
                      />
                      <p className="text-slate-500 font-semibold">
                        No exam results found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Results will appear here once exams are graded.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <UpgradePrompt feature="analytics" />
              )
              )}

              {activeTab === "Fee Status" && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <DollarSign size={24} className="text-blue-500" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Fee Status
                    </h3>
                  </div>

                  {loadingFee ? (
                    <div className="flex items-center justify-center h-48">
                      <LoadingSpinner size="md" message="Loading fee data..." />
                    </div>
                  ) : feeData.length > 0 ? (
                    <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                                Total Fee
                              </p>
                              <p className="text-xl font-black text-blue-700">
                                ${Number(feeSummary.totalAmount).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                                Total Paid
                              </p>
                              <p className="text-xl font-black text-emerald-700">
                                ${Number(feeSummary.totalPaid).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
                                Pending
                              </p>
                              <p className="text-xl font-black text-rose-700">
                                ${Number(feeSummary.totalPending).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Progress
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${feeSummary.paidPercentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-black text-slate-700">
                                  {feeSummary.paidPercentage}%
                                </span>
                              </div>
                            </div>
                          </div>

                      <div className="space-y-3">
                        {feeData.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="text-base font-black text-slate-900">
                                  Term {transaction.termNumber || 1}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {transaction.academicYearName}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  transaction.status === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : transaction.status === "partial"
                                      ? "bg-amber-100 text-amber-700"
                                      : transaction.status === "waived"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {transaction.status === "paid" ? (
                                  <CheckCircle size={10} />
                                ) : transaction.status === "partial" ? (
                                  <Clock size={10} />
                                ) : (
                                  <XCircle size={10} />
                                )}
                                {transaction.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  Original
                                </p>
                                <p className="font-bold text-slate-700">
                                  $
                                  {Number(transaction.originalAmount).toFixed(
                                    2,
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  Paid
                                </p>
                                <p className="font-bold text-emerald-600">
                                  ${Number(transaction.amountPaid).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  Pending
                                </p>
                                <p className="font-bold text-rose-600">
                                  $
                                  {Number(transaction.amountPending).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  Due Date
                                </p>
                                <p className="font-bold text-slate-700">
                                  {new Date(
                                    transaction.dueDate,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {Number(transaction.waiverAmount) > 0 && (
                                <div>
                                  <p className="text-[9px] text-purple-600 font-bold uppercase">
                                    Waiver
                                  </p>
                                  <p className="font-bold text-purple-600">
                                    -$
                                    {Number(transaction.waiverAmount).toFixed(
                                      2,
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {transaction.status !== "pending" &&
                              transaction.paymentDate && (
                                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-3 text-[10px]">
                                  <div>
                                    <span className="text-slate-400">
                                      Paid:{" "}
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      {new Date(
                                        transaction.paymentDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {transaction.paymentMode && (
                                    <div>
                                      <span className="text-slate-400">
                                        Mode:{" "}
                                      </span>
                                      <span className="font-bold text-slate-700 capitalize">
                                        {transaction.paymentMode.replace(
                                          /_/g,
                                          " ",
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {transaction.receiptNumber && (
                                    <div>
                                      <span className="text-slate-400">
                                        Receipt:{" "}
                                      </span>
                                      <span className="font-bold text-slate-700">
                                        {transaction.receiptNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign
                        size={32}
                        className="mx-auto text-slate-300 mb-2"
                      />
                      <p className="text-sm text-slate-500">
                        No fee records found
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <ConfirmDialog
            isOpen={showDeactivateModal}
            onClose={() => setShowDeactivateModal(false)}
            onConfirm={handleDeactivate}
            title="Deactivate Student"
            message={`Are you sure you want to deactivate ${student?.fullName}? The student will no longer be able to access the system. You can reactivate them at any time.`}
            confirmText="Deactivate"
            cancelText="Cancel"
            variant="warning"
            loading={deactivateStudent.isPending}
          />
        </div>
      </div>
    </div>
  );

  if (loadingStudent) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading student profile..." />
      </div>
    );
  }

  return renderContent();
};

export default StudentProfile;

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
} from "lucide-react";
import { ResponsiveContainer } from "recharts";
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
} from "../../lib/subject-utils";
import { useActivateStudent, useDeactivateStudent } from "../../hooks/mutations";
import { useAuth } from "../../context/AuthContext";
import type { Student } from "../../types/student";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import UpgradePrompt from "../../components/common/UpgradePrompt";
import PageHeader from "../../components/common/PageHeader";
import { getLocalDateString } from "../../lib/utils";
import { TabBar } from "../../components/ui";
import ProfileInfoRow from "../../components/common/ProfileInfoRow";
import SubjectCard from "../../components/students/SubjectCard";
import AttendanceSummary from "../../components/students/AttendanceSummary";
import AttendanceLegend from "../../components/students/AttendanceLegend";
import ExamTypeFilter from "../../components/students/ExamTypeFilter";
import FeeStatsRow from "../../components/fee/FeeStatsRow";
import FeeTransactionCard from "../../components/fee/FeeTransactionCard";

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

            <div className="space-y-4 text-left border-t border-slate-50 pt-8">
              <ProfileInfoRow
                icon={Users}
                label="Parent"
                value={student?.parentName ?? "N/A"}
              />
              <ProfileInfoRow
                icon={Phone}
                label="Phone"
                value={student?.phone ?? "N/A"}
              />
              <ProfileInfoRow
                icon={Mail}
                label="Email"
                value={<>{student?.phone?.replace(/\D/g, "")}@email.com</>}
              />
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

                <AttendanceLegend
                  presentCount={attendanceSummary.presentCount}
                  absentCount={attendanceSummary.absentCount}
                  holidayCount={attendanceSummary.holidayCount}
                  sundayCount={attendanceSummary.sundayCount}
                />
              </div>

              <AttendanceSummary
                data={attendanceSummary}
                studentName={student?.fullName ?? ""}
              />
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

                  <ExamTypeFilter
                    activeType={activeType}
                    onChange={setActiveType}
                  />

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
                      <FeeStatsRow
                        totalAmount={feeSummary.totalAmount}
                        totalPaid={feeSummary.totalPaid}
                        totalPending={feeSummary.totalPending}
                        paidPercentage={feeSummary.paidPercentage}
                      />

                      <div className="space-y-3">
                        {feeData.map((transaction) => (
                          <FeeTransactionCard
                            key={transaction.id}
                            termNumber={transaction.termNumber}
                            academicYearName={transaction.academicYearName}
                            status={transaction.status}
                            originalAmount={transaction.originalAmount}
                            amountPaid={transaction.amountPaid}
                            amountPending={transaction.amountPending}
                            dueDate={transaction.dueDate}
                            waiverAmount={transaction.waiverAmount}
                            paymentDate={transaction.paymentDate}
                            paymentMode={transaction.paymentMode}
                            receiptNumber={transaction.receiptNumber}
                          />
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

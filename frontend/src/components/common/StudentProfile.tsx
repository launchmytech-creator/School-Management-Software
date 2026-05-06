import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import PerformanceTrendChart from "../../components/charts/PerformanceTrendChart";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
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
  useActivateStudent,
  useDeactivateStudent,
} from "../../hooks/mutations";
import { useAuth } from "../../context/AuthContext";
import type { Student } from "../../types/student";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import UpgradePrompt from "../../components/common/UpgradePrompt";
import PageHeader from "../../components/common/PageHeader";
import { getLocalDateString } from "../../lib/utils";
import { TabBar } from "../../components/ui";
import SubjectCard from "../../components/students/SubjectCard";
import AttendanceSummary from "../../components/students/AttendanceSummary";
import AttendanceLegend from "../../components/students/AttendanceLegend";
import FeeStatsRow from "../../components/fee/FeeStatsRow";
import FeeTransactionCard from "../../components/fee/FeeTransactionCard";
import { StudentProfileCard } from "../../components/students/StudentProfileCard";
import { EXAM_TYPES } from "../../lib/subject-utils";
import {
  Calendar,
  type CalendarDay as CalendarDayType,
} from "../../components/common/Calendar";

interface StudentProfileProps {
  layout?: "admin" | "accountant" | "teacher";
}

const StudentProfile: React.FC<StudentProfileProps> = ({ layout }) => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasFeature } = useAuth();

  // Auto-detect layout from AuthContext if not provided
  const resolvedLayout =
    layout ??
    (user?.role === "teacher"
      ? "teacher"
      : user?.role === "accountant"
        ? "accountant"
        : "admin");

  const studentId = id ? parseInt(id) : 0;

  const { data: studentData, isLoading: loadingStudent } =
    useStudentById(studentId);
  const { data: academicYears = [] } = useAcademicYears();
  const [currentAcademicYear, setCurrentAcademicYear] = useState<{
    name: string;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Attendance");
  const [activeSubject, setActiveSubject] = useState("Mathematics");
  const [activeType, setActiveType] = useState("All");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  React.useEffect(() => {
    const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
    setCurrentAcademicYear(current);
  }, [academicYears]);

  const { data: holidays = [] } = useHolidays(currentMonth.getFullYear());

  const monthStart = useMemo(() => {
    return getLocalDateString(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    );
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    return getLocalDateString(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    );
  }, [currentMonth]);

  const { data: attendanceRecords = [], isLoading: loadingAttendance } =
    useAttendance({
      studentId,
      startDate: monthStart,
      endDate: monthEnd,
    });

  const { data: marksData = [], isLoading: loadingMarks } =
    useStudentResults(studentId);
  const { data: feeData = [], isLoading: loadingFee } =
    useStudentFees(studentId);

  const feeSummary = React.useMemo(
    () => computeFeeSummary(feeData as FeeTransaction[]),
    [feeData],
  );

  const activateStudent = useActivateStudent();
  const deactivateStudent = useDeactivateStudent();

  const student: Student | null = studentData
    ? {
        ...studentData,
        fullName: studentData.fullName || "Student",
        className: studentData.className || "Class",
        parentName: studentData.parentName || "Parent",
        phone: studentData.phone || "+1 234 567 890",
        status: studentData.status || "active",
      }
    : null;

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

  const calendarDays = useMemo<CalendarDayType[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDayType[] = [];

    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSunday: false,
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

      let attendanceStatus: "present" | "absent" | "leave" | "half_day" | null =
        null;
      if (attendance?.status === "present" || attendance?.status === "late") {
        attendanceStatus = "present";
      } else if (
        attendance?.status === "absent" ||
        attendance?.status === "excused"
      ) {
        attendanceStatus = "absent";
      }

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSunday,
        holiday: holiday ? { description: holiday.description } : undefined,
        attendance: holiday ? null : attendanceStatus,
      });
    }

    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSunday: false,
      });
    }

    return days;
  }, [currentMonth, attendanceRecords, holidays]);

  const attendanceSummary = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const totalDays = monthDays.length;
    const holidayCount = monthDays.filter((d) => d.holiday).length;
    const sundayCount = monthDays.filter((d) => d.isSunday).length;
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

  const isAdmin = resolvedLayout === "admin";
  const isAccountant = resolvedLayout === "accountant";
  const isTeacher = resolvedLayout === "teacher";
  const basePath = isAdmin
    ? "/admin"
    : isAccountant
      ? "/accountant"
      : "/teacher";

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Student Profile"
        subtitle={
          student
            ? `${student.fullName} - ${student.className || "N/A"}`
            : "View student details"
        }
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
          <StudentProfileCard
            student={student}
            currentAcademicYearName={currentAcademicYear?.name || ""}
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            onEdit={handleEdit}
            onActivate={handleActivate}
            onDeactivate={() => setShowDeactivateModal(true)}
            activatePending={activateStudent.isPending}
            deactivatePending={deactivateStudent.isPending}
          />
        </div>

        <div className="lg:col-span-9 space-y-8">
          <TabBar
            tabs={[
              { key: "Attendance", label: "Attendance" },
              { key: "Marks", label: "Marks" },
              ...(!isTeacher
                ? [{ key: "Fee Status", label: "Fee Status" }]
                : []),
              { key: "Performance", label: "Performance" },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "Attendance" &&
            (hasFeature("attendance") ? (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-3">
                  <Calendar
                    calendarDays={calendarDays}
                    loading={loadingAttendance}
                    canGoPrev={canGoPrev}
                    canGoNext={canGoNext}
                    monthYear={monthYear}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                    itemType="attendance"
                    title="Attendance Calendar"
                  />
                  <div className="mt-2">
                    <AttendanceLegend
                      presentCount={attendanceSummary.presentCount}
                      absentCount={attendanceSummary.absentCount}
                      holidayCount={attendanceSummary.holidayCount}
                      sundayCount={attendanceSummary.sundayCount}
                    />
                  </div>
                </div>
                <AttendanceSummary
                  data={attendanceSummary}
                  studentName={student?.fullName ?? ""}
                />
              </div>
            ) : (
              <UpgradePrompt feature="attendance" />
            ))}

          {activeTab !== "Attendance" && (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              {activeTab === "Marks" && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Award size={24} className="text-blue-500" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Academic Performance
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    {EXAM_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          activeType === type
                            ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {type}
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

              {activeTab === "Performance" &&
                (hasFeature("analytics") ? (
                  <div className="space-y-6">
                    {loadingMarks ? (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex items-center justify-center">
                        <LoadingSpinner
                          size="md"
                          message="Loading performance data..."
                        />
                      </div>
                    ) : trendData.length > 0 ? (
                      <PerformanceTrendChart
                        trendData={trendData}
                        allSubjects={allSubjects}
                        activeSubject={activeSubject}
                        onSubjectChange={setActiveSubject}
                      />
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
                ))}

              {activeTab === "Fee Status" && (
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">
                    Fee Status
                  </h3>

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

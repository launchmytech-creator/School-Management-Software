import React, { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import AttendanceStatsGrid from "../../components/common/AttendanceStatsGrid";
import { AttendanceTable } from "./AttendanceTable";
import { AttendanceConfirmModal } from "../../components/modals/AttendanceConfirmModal";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useAuth } from "../../context/AuthContext";
import {
  useClassesByIncharge,
  useClasses,
} from "../../hooks/queries/useClasses";
import { useAllStudents } from "../../hooks/queries/useStudents";
import {
  useClassAttendance,
  useMarkAttendance,
} from "../../hooks/queries/useAttendance";
import { useHolidays } from "../../hooks/queries/useHolidays";
import { type Class } from "../../types/class";
import { type Student } from "../../types/student";
import { type MarkAttendanceDto } from "../../services/attendanceService";
import {
  Users,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  Lock,
} from "lucide-react";
import { getLocalDateString } from "../../lib/utils";
import { QueryErrorFallback } from "../../components/error";

type AttendanceStatus = "present" | "absent";

interface StudentAttendanceProps {
  layout?: "teacher" | "accountant";
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({ layout }) => {
  const { user } = useAuth();
  
  // Auto-detect layout from AuthContext if not provided
  const resolvedLayout = layout ?? (user?.role === 'teacher' ? 'teacher' 
    : user?.role === 'accountant' ? 'accountant' 
    : 'admin');
    
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDateString());
  const [attendanceRecords, setAttendanceRecords] = useState<
    Map<number, AttendanceStatus>
  >(new Map());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const teacherId = user?.id as number;
  const isTeacher = resolvedLayout === "teacher";

  const { data: inchargeClasses = [], isLoading: loadingInchargeClasses } =
    useClassesByIncharge(
      teacherId,
      selectedYear?.id ? Number(selectedYear?.id) : undefined,
    );

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const { data: allStudents = [] } = useAllStudents();
  const { data: existingAttendance = [] } = useClassAttendance(
    selectedClass ? parseInt(selectedClass.id) : 0,
    selectedDate,
  );
  const { data: holidays = [] } = useHolidays(
    selectedYear?.id ? Number(selectedYear.id) : undefined,
  );

  const markAttendance = useMarkAttendance();

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const classId = parseInt(selectedClass.id);
    return allStudents.filter((s) => s.currentClassId === classId);
  }, [allStudents, selectedClass]);

  const students = classStudents;

  React.useEffect(() => {
    if (existingAttendance.length > 0) {
      const records = new Map<number, AttendanceStatus>();
      existingAttendance.forEach((record) => {
        if (record.status === "present" || record.status === "absent") {
          records.set(record.studentId, record.status);
        }
      });
      setAttendanceRecords(records);
      setHasChanges(false);
    } else if (
      existingAttendance.length === 0 &&
      classStudents.length > 0 &&
      !hasChanges
    ) {
      const initialRecords = new Map<number, AttendanceStatus>();
      classStudents.forEach((s) => {
        initialRecords.set(s.id, "present");
      });
      setAttendanceRecords(initialRecords);
    }
  }, [existingAttendance, classStudents]);

  React.useEffect(() => {
    if (isTeacher && inchargeClasses.length === 1 && !selectedClass) {
      setSelectedClass(inchargeClasses[0]);
    }
  }, [inchargeClasses, selectedClass, isTeacher]);

  const isHoliday = (date: string) =>
    holidays.some((h) => h.holidayDate === date);
  const isSunday = (date: string) => new Date(date).getDay() === 0;
  const getHolidayInfo = (date: string) =>
    holidays.find((h) => h.holidayDate === date);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const selected =
      inchargeClasses.find((c) => c.id === classId) ||
      allClasses.find((c) => c.id === classId) ||
      null;
    setSelectedClass(selected);
    setHasChanges(false);
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    const newRecords = new Map<number, AttendanceStatus>();
    students.forEach((s) => {
      newRecords.set(s.id, "present");
    });
    setAttendanceRecords(newRecords);
    setHasChanges(true);
  };

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    students.forEach((s) => {
      const status = attendanceRecords.get(s.id);
      if (status === "present") present++;
      else if (status === "absent") absent++;
    });
    return { total: students.length, present, absent };
  }, [students, attendanceRecords]);

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    const records = students.map((s) => ({
      studentId: s.id,
      status: attendanceRecords.get(s.id) || "present",
    }));

    const data: MarkAttendanceDto = {
      classId: parseInt(selectedClass.id),
      attendanceDate: selectedDate,
      records,
    };

    try {
      await markAttendance.mutateAsync(data);
      showNotification("Attendance marked successfully!", "success");
      setHasChanges(false);
      setShowConfirmModal(false);
    } catch (error: any) {
      if (error.response?.status === 403) {
        showNotification(
          error.response?.data?.message ||
            "You are not authorized to mark attendance for this class",
          "error",
        );
      } else {
        showNotification("Failed to mark attendance", "error");
      }
    }
  };

  const isDateInFuture = selectedDate > getLocalDateString();
  const isHolidayDate = isHoliday(selectedDate);
  const isSundayDate = isSunday(selectedDate);
  const cannotMarkAttendance = isDateInFuture || isHolidayDate || isSundayDate;

  const basePath = isTeacher ? "/teacher" : "/accountant";
  const currentClassName = selectedClass?.name;
  const hasSelectedClass = !!selectedClass;
  const loadingClasses = false;

  const renderContent = () => (
    <QueryErrorFallback>
      <div className="space-y-6 pb-12">
        {isTeacher && (
          <PageHeader
            title="Student Attendance"
            subtitle="Mark and manage attendance for your classes"
            breadcrumb={{
              links: [
                { label: "People", href: `${basePath}/students` },
                { label: "Attendance", active: true },
              ],
            }}
            actions={[
              {
                label: "Mark All Present",
                icon: CheckCircle,
                onClick: handleMarkAllPresent,
                disabled:
                  students.length === 0 || !hasChanges || cannotMarkAttendance,
              },
            ]}
          />
        )}

        {!isTeacher && (
          <PageHeader
            title="Student Attendance"
            subtitle="View and mark attendance for classes"
            breadcrumb={{
              links: [
                { label: "People", href: `${basePath}/students` },
                { label: "Attendance", active: true },
              ],
            }}
            actions={[
              {
                label: "Mark All Present",
                icon: CheckCircle,
                onClick: handleMarkAllPresent,
                disabled:
                  students.length === 0 || !hasChanges || cannotMarkAttendance,
              },
            ]}
          />
        )}

        {isHolidayDate && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500">
              celebration
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Holiday: {getHolidayInfo(selectedDate)?.description}
              </p>
              <p className="text-xs text-amber-600">
                Attendance cannot be marked on holidays
              </p>
            </div>
          </div>
        )}

        {isSundayDate && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-500">
              weekend
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">Sunday</p>
              <p className="text-xs text-slate-500">
                Attendance cannot be marked on Sundays
              </p>
            </div>
          </div>
        )}

        <div className="flex items-end gap-4 flex-wrap">
          {isTeacher ? (
            <>
              {inchargeClasses.length > 1 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex-1 min-w-0">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Class
                  </label>
                  <div className="flex items-start gap-2 flex-wrap">
                    {inchargeClasses.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          selectedClass?.id === cls.id
                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cls.name}{" "}
                        {cls.section ? `- Section ${cls.section}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inchargeClasses.length === 1 && selectedClass && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-slate-700 whitespace-nowrap">
                    Class:
                  </label>
                  <span className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200">
                    {selectedClass.name}{" "}
                    {selectedClass.section
                      ? `- Section ${selectedClass.section}`
                      : ""}
                  </span>
                </div>
              )}

              {inchargeClasses.length === 0 && !loadingInchargeClasses && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-full">
                      <Lock className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-red-800">
                        Access Denied
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        You are not assigned as incharge for any class. Contact
                        your administrator to assign you as a class incharge.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <label className="text-sm font-bold text-slate-700 whitespace-nowrap">
                Class:
              </label>
              <select
                value={selectedClass?.id || ""}
                onChange={handleClassChange}
                disabled={loadingClasses}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingClasses ? "Loading classes..." : "Select a class"}
                </option>
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `- Section ${cls.section}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-700 whitespace-nowrap">
              Attendance Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getLocalDateString()}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isDateInFuture && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700 font-medium">
              You cannot mark attendance for future dates.
            </p>
          </div>
        )}

        {existingAttendance.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-blue-700 font-medium">
              Attendance has already been marked for this date. You can update
              it below.
            </p>
          </div>
        )}

        {hasSelectedClass && <AttendanceStatsGrid stats={stats} />}

        {hasSelectedClass ? (
          students.length > 0 ? (
            <AttendanceTable
              students={students as Student[]}
              attendanceRecords={attendanceRecords}
              hasChanges={hasChanges}
              isDateInFuture={isDateInFuture}
              existingAttendanceCount={existingAttendance.length}
              isPending={markAttendance.isPending}
              onStatusChange={handleStatusChange}
              onMarkAllPresent={handleMarkAllPresent}
              onConfirm={() => setShowConfirmModal(true)}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No students found"
              description={`No students are enrolled in ${currentClassName || "this class"} for the selected academic year.`}
            />
          )
        ) : isTeacher && inchargeClasses.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="Access Denied"
            description="You are not assigned as incharge for any class. Contact your administrator to assign you as a class incharge."
          />
        ) : !isTeacher ? (
          <EmptyState
            icon={Users}
            title="Please select a class"
            description="Choose a class to mark attendance"
          />
        ) : null}

        <AttendanceConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSaveAttendance}
          selectedDate={selectedDate}
          currentClassName={currentClassName}
          stats={stats}
          existingAttendanceCount={existingAttendance.length}
          isPending={markAttendance.isPending}
        />
      </div>
    </QueryErrorFallback>
  );

  return renderContent();
};

export default StudentAttendance;

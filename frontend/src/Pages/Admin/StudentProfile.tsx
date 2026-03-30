import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import {
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { studentService } from "../../services/studentService";
import {
  attendanceService,
  type AttendanceRecord,
} from "../../services/attendanceService";
import { holidayService, type Holiday } from "../../services/holidayService";
import { academicYearService } from "../../services/academicYearService";
import type { AcademicYear } from "../../types/academicYear";
import type { Student } from "../../types/student";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { getLocalDateString } from "../../lib/utils";

type AttendanceStatus = "present" | "absent" | "holiday" | "sunday" | "none";

interface CalendarDay {
  date: Date;
  dateStr: string;
  status: AttendanceStatus;
  isCurrentMonth: boolean;
  holiday?: Holiday;
}

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("Attendance");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentAcademicYear, setCurrentAcademicYear] =
    useState<AcademicYear | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const years = await academicYearService.getAllYears();
      const current = years.find((y) => y.isCurrent) || years[0];
      setCurrentAcademicYear(current);
    } catch {
      setCurrentAcademicYear(null);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const year = currentMonth.getFullYear();
      const data = await holidayService.getHolidays(year);
      setHolidays(data);
    } catch {
      setHolidays([]);
    }
  }, [currentMonth]);

  const fetchAttendance = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingAttendance(true);
      const monthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const monthEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );

      const data = await attendanceService.getAttendance({
        studentId: parseInt(id),
        startDate: getLocalDateString(monthStart),
        endDate: getLocalDateString(monthEnd),
      });

      setAttendanceRecords(data);
    } catch {
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [id, currentMonth]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (id) {
          const data = await studentService.getStudentById(parseInt(id));
          setStudent({
            ...data,
            fullName: data.fullName || "Ethan Caldwell",
            className: data.className || "Grade 10 - A",
            parentName: data.parentName || "Michael Caldwell",
            phone: data.phone || "+1 234 567 890",
            status: data.status || "active",
          });
        }
      } catch {
        // Error will be handled by notification
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
    fetchAcademicYears();
  }, [id, fetchAcademicYears]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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


  if (loading) {
    return (
      <AdminLayout title="Student Profile">
        <div className="h-96 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading student profile..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Student Profile">
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>Students</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-500">Student Profile</span>
          </div>
        </div>

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
                <div className="absolute bottom-1 right-1 size-6 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {student?.fullName}
              </h2>
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
                <button className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">
                  Edit Profile
                </button>
                <button className="w-full py-3.5 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all active:scale-95">
                  Delete Student
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-8">
            <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2">
              {["Attendance", "Marks", "Fee Status", "Reports"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-6 rounded-2xl text-[13px] font-black transition-all ${
                    activeTab === tab
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Attendance" && (
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
                      <LoadingSpinner
                        size="md"
                        message="Loading attendance..."
                      />
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
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StudentProfile;

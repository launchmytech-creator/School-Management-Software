import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, 
  BookOpen, ChevronLeft, ChevronRight, Loader2, Clock,
  Users, MapPin,
  Briefcase
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTeacherById, useTeacherAllocations, useTeacherAttendance, useHolidays } from "../../hooks/queries";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { getLocalDateString, formatDate } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";
import { TabBar } from "../../components/ui";
import ProfileInfoRow from "../../components/common/ProfileInfoRow";
import AttendanceLegend from "../../components/students/AttendanceLegend";

type AttendanceStatus = 'present' | 'absent' | 'late' | 'holiday' | 'sunday' | 'none';

interface CalendarDay {
  date: Date;
  dateStr: string;
  status: AttendanceStatus;
  isCurrentMonth: boolean;
  holiday?: { holidayDate: string; description: string };
}

const TeacherProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('Attendance');
  
  const teacherId = Number(id);
  const { data: teacher, isLoading: teacherLoading } = useTeacherById(teacherId);
  const { data: allocationsData, isLoading: allocLoading } = useTeacherAllocations(teacherId);
  const allocations = allocationsData ?? [];
  const loading = teacherLoading || allocLoading;

  // Attendance state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = getLocalDateString(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const monthEnd = getLocalDateString(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

  const { data: attendanceRecords = [] } = useTeacherAttendance({
    teacherId: teacherId,
    startDate: monthStart,
    endDate: monthEnd,
  });

  const { data: holidays = [] } = useHolidays(currentMonth.getFullYear());

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
        status: 'none',
        isCurrentMonth: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);
      const attendance = attendanceRecords.find(r => getLocalDateString(new Date(r.attendanceDate)) === dateStr);
      const holiday = holidays.find(h => h.holidayDate === dateStr);
      const isSunday = date.getDay() === 0;

      let status: AttendanceStatus = 'none';
      if (holiday) {
        status = 'holiday';
      } else if (isSunday) {
        status = 'sunday';
      } else if (attendance?.status === 'present') {
        status = 'present';
      } else if (attendance?.status === 'absent') {
        status = 'absent';
      } else if (attendance?.status === 'late') {
        status = 'late';
      }

      days.push({
        date,
        dateStr,
        status,
        isCurrentMonth: true,
        holiday
      });
    }

    return days;
  }, [currentMonth, attendanceRecords, holidays]);

  const attendanceStats = useMemo(() => {
    const monthDays = calendarDays.filter(d => d.isCurrentMonth);
    const totalDays = monthDays.length;
    const holidayCount = monthDays.filter(d => d.status === 'holiday').length;
    const sundayCount = monthDays.filter(d => d.status === 'sunday').length;
    const workingDays = totalDays - holidayCount - sundayCount;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const percentage = workingDays > 0 ? Math.round(((presentCount + lateCount * 0.5) / workingDays) * 100) : 0;

    return { totalDays, holidayCount, sundayCount, workingDays, presentCount, absentCount, lateCount, percentage };
  }, [calendarDays, attendanceRecords]);

  const pieChartData = useMemo(() => {
    const data = [
      { name: "Present", value: attendanceStats.presentCount, color: "#10B981" },
      { name: "Late", value: attendanceStats.lateCount, color: "#F59E0B" },
      { name: "Absent", value: attendanceStats.absentCount, color: "#EF4444" },
    ].filter(d => d.value > 0);
    
    if (attendanceStats.workingDays > 0 && data.length > 0) {
      const attendedDays = attendanceStats.presentCount + attendanceStats.lateCount + attendanceStats.absentCount;
      const unrecordedDays = attendanceStats.workingDays - attendedDays;
      if (unrecordedDays > 0) {
        data.push({ name: "Working Days", value: unrecordedDays, color: "#f1f5f9" });
      }
    }
    
    return data;
  }, [attendanceStats]);

  const canGoPrev = useMemo(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonth >= new Date(new Date().getFullYear() - 1, 0, 1);
  }, [currentMonth]);

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return nextMonth <= today;
  }, [currentMonth]);

  const prevMonth = () => {
    if (canGoPrev) setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    if (canGoNext) setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="size-12 animate-spin text-blue-500 opacity-50" />
        <p className="font-display font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Teacher Profile"
        subtitle={teacher.fullName}
        breadcrumb={{
          links: [
            { label: "People", href: "/admin/teachers" },
            { label: "Teacher Profile", active: true },
          ],
        }}
      />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              
              <div className="relative inline-block mb-6">
                <div className="size-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.fullName}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-1 right-1 size-6 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{teacher.fullName}</h2>
              <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-500 text-[11px] font-black rounded-full uppercase tracking-widest mb-2">
                {teacher.role || 'Teacher'}
              </div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">ID: #{teacher.id.toString().padStart(4, '0')}</p>

              <div className="space-y-4 text-left border-t border-slate-50 pt-6">
                <ProfileInfoRow
                  icon={Mail}
                  label="Email"
                  value={teacher.email}
                  truncate
                />
                <ProfileInfoRow
                  icon={Phone}
                  label="Phone"
                  value={teacher.phone || "Not provided"}
                />
                <ProfileInfoRow
                  icon={Calendar}
                  label="Date of Birth"
                  value={teacher.dateOfBirth ? formatDate(teacher.dateOfBirth) : "Not set"}
                />
                <ProfileInfoRow
                  icon={User}
                  label="Gender"
                  value={teacher.gender || "Not set"}
                />
                {teacher.address && (
                  <ProfileInfoRow
                    icon={MapPin}
                    label="Address"
                    value={teacher.address}
                  />
                )}
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Edit Profile
                </button>
                <button 
                  className="w-full py-3.5 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Deactivate
                </button>
              </div>
              </div>
            </div>

            {/* Right Column - Tabs Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Tab Navigation */}
            <TabBar
              variant="gradient"
              tabs={[
                { key: "Attendance", label: "Attendance" },
                { key: "Classes", label: "Classes" },
                { key: "Schedule", label: "Schedule" },
              ]}
              active={activeTab}
              onChange={setActiveTab}
              className="overflow-x-auto"
            />

            {/* Attendance Tab */}
            {activeTab === 'Attendance' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{monthYear} Attendance</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teacher Attendance Record</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={prevMonth} 
                        disabled={!canGoPrev}
                        className={`p-2 rounded-xl transition-colors ${canGoPrev ? 'bg-slate-50 text-slate-400 hover:text-slate-600' : 'bg-slate-50 text-slate-200'}`}
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button 
                        onClick={nextMonth}
                        disabled={!canGoNext}
                        className={`p-2 rounded-xl transition-colors ${canGoNext ? 'bg-slate-50 text-slate-400 hover:text-slate-600' : 'bg-slate-50 text-slate-200'}`}
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                      <div key={d} className={`text-[10px] font-black text-center uppercase tracking-widest py-2 ${d === 'SUN' ? 'text-red-400' : 'text-slate-300'}`}>{d}</div>
                    ))}
                  </div>

                  {false ? (
                    <div className="h-64 flex items-center justify-center">
                      <LoadingSpinner size="md" message="Loading attendance..." />
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => (
                        <div 
                          key={index}
                          className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all cursor-default ${
                            day.status === 'present' ? 'bg-emerald-500 text-white' :
                            day.status === 'absent' ? 'bg-rose-500 text-white' :
                            day.status === 'late' ? 'bg-amber-500 text-white' :
                            day.status === 'holiday' ? 'bg-purple-500 text-white' :
                            day.status === 'sunday' ? 'bg-red-50 text-red-400 border border-red-100' :
                            !day.isCurrentMonth ? 'bg-transparent text-slate-200' : 'bg-slate-50 text-slate-300'
                          }`}
                        >
                          <span>{day.date.getDate()}</span>
                          {day.status === 'holiday' && day.holiday && (
                            <span className="text-[6px] font-bold mt-0.5 truncate max-w-full px-1">{day.holiday.description.substring(0, 6)}..</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <AttendanceLegend
                    presentCount={attendanceStats.presentCount}
                    absentCount={attendanceStats.absentCount}
                    holidayCount={attendanceStats.holidayCount}
                    sundayCount={attendanceStats.sundayCount}
                    lateCount={attendanceStats.lateCount}
                    showLate
                    holidayColor="purple"
                  />
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">
                    Attendance Summary
                  </h3>

                  <div className="relative w-48 h-48 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-800 tracking-tight">
                        {attendanceStats.percentage}%
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
                        {attendanceStats.workingDays}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                      <span className="text-xs font-bold text-emerald-600">
                        Present Days
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {attendanceStats.presentCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                      <span className="text-xs font-bold text-amber-600">
                        Late Days
                      </span>
                      <span className="text-lg font-black text-amber-700">
                        {attendanceStats.lateCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">
                        Absent Days
                      </span>
                      <span className="text-lg font-black text-slate-700">
                        {attendanceStats.absentCount}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
                    {teacher.fullName?.split(" ")[0]} has{" "}
                    {attendanceStats.percentage >= 90
                      ? "excellent"
                      : attendanceStats.percentage >= 75
                        ? "good"
                        : "needs improvement"}{" "}
                    attendance this month.
                  </p>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'Classes' && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="size-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                    <Briefcase className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Class Allocations</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subjects & Classes Assigned</p>
                  </div>
                </div>
                {allocations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allocations.map((alloc) => (
                      <div key={alloc.id} className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-lg hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <BookOpen className="size-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{alloc.subjectName}</h4>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Class {alloc.className}-{alloc.classSection}</span>
                            <span className="text-[9px] text-slate-400">{alloc.subjectCode}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Year</span>
                          <span className="text-[10px] font-black text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">{alloc.yearName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                    <Users className="size-12 mb-3 opacity-20" />
                    <p className="font-bold text-sm">No class allocations found</p>
                    <p className="text-xs font-medium mt-1">This teacher has no subject allocations yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'Schedule' && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="size-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Teaching Schedule</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Timetable</p>
                  </div>
                </div>
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                  <Clock className="size-12 mb-3 opacity-20" />
                  <p className="font-bold text-sm">Schedule Not Available</p>
                  <p className="text-xs font-medium mt-1">Timetable integration coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default TeacherProfile;

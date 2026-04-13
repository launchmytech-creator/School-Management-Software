import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { teacherAttendanceService, type TeacherAttendance } from '../../services/teacherAttendanceService';
import { teacherService } from '../../services/teacherService';
import type { Teacher } from '../../types/teacher';
import { Users, CheckCircle, XCircle, Clock, CalendarCheck } from 'lucide-react';
import { formatDate, getLocalDateString } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';

const TeacherAttendancePage: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<TeacherAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markingStatus, setMarkingStatus] = useState<Record<number, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);

      const initialStatus: Record<number, 'present' | 'absent' | 'late'> = {};
      data.forEach(t => { initialStatus[t.id] = 'present'; });
      setMarkingStatus(initialStatus);
    } catch {
      showNotification('Failed to fetch teachers', 'error');
    }
  }, [showNotification]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;
    try {
      setLoading(true);
      const data = await teacherAttendanceService.getAttendanceByDate(selectedDate);
      setAttendance(data);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; hasAttendance: boolean }[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false, isToday: false, hasAttendance: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);
      const hasAttendanceRecord = attendance.some(a => a.attendanceDate === dateStr);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        hasAttendance: hasAttendanceRecord,
      });
    }

    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, isToday: false, hasAttendance: false });
    }

    return days;
  }, [currentMonth, attendance]);

  const stats = {
    total: teachers.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
  };

  const handleStatusChange = (teacherId: number, status: 'present' | 'absent' | 'late') => {
    setMarkingStatus(prev => ({ ...prev, [teacherId]: status }));
  };

  const handleMarkAttendance = async () => {
    try {
      setSaving(true);
      const records = teachers.map(t => ({
        teacherId: t.id,
        status: markingStatus[t.id] || 'present',
      }));
      
      await teacherAttendanceService.markAttendance({
        attendanceDate: selectedDate,
        records,
      });
      
      showNotification('Attendance marked successfully', 'success');
      setShowMarkModal(false);
      fetchAttendance();
    } catch {
      showNotification('Failed to mark attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6 pb-12">
        <PageHeader 
          title="Teacher Attendance"
          subtitle="Track and manage teacher attendance records"
          breadcrumb={{
            links: [
              { label: "People", href: "/admin/teachers" },
              { label: "Teacher Attendance", active: true }
            ]
          }}
          actions={[
            {
              label: "Mark Attendance",
              icon: CalendarCheck,
              onClick: () => setShowMarkModal(true)
            }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Teachers</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
                <p className="text-sm text-emerald-600">Present</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-700">{stats.absent}</p>
                <p className="text-sm text-rose-600">Absent</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                <p className="text-sm text-amber-600">Late</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900">Attendance Calendar</h3>
                <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-semibold text-slate-900">{monthYear}</span>
                  <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={day} className={`text-center py-2 text-xs font-bold uppercase tracking-widest ${index === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => day.isCurrentMonth && setSelectedDate(getLocalDateString(day.date))}
                    className={`
                      h-16 p-2 rounded-lg transition-colors cursor-pointer
                      ${!day.isCurrentMonth ? 'text-slate-300' : ''}
                      ${day.isToday ? 'border-2 border-blue-500 bg-blue-50' : 'border border-slate-100'}
                      ${day.hasAttendance ? 'bg-emerald-50 border-emerald-200' : ''}
                      ${day.isCurrentMonth && !day.isToday && !day.hasAttendance ? 'hover:bg-slate-50' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium ${day.isToday ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                      {day.date.getDate()}
                    </span>
                    {day.hasAttendance && (
                      <div className="flex items-center justify-center mt-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Attendance for {formatDate(selectedDate)}</h3>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-pulse text-slate-400">Loading...</div>
                </div>
              ) : attendance.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                          {record.teacherName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{record.teacherName}</p>
                          <p className="text-xs text-slate-500">{record.teacherEmail}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  title="No attendance marked"
                  description={`No attendance recorded for ${formatDate(selectedDate)}`}
                  action={{
                    label: "Mark Attendance",
                    icon: CalendarCheck,
                    onClick: () => setShowMarkModal(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <BaseModal
          isOpen={showMarkModal}
          onClose={() => setShowMarkModal(false)}
          title="Mark Teacher Attendance"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Mark attendance for <span className="font-semibold">{formatDate(selectedDate)}</span>
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                      {teacher.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{teacher.fullName}</p>
                      <p className="text-xs text-slate-500">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(teacher.id, 'present')}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        markingStatus[teacher.id] === 'present'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleStatusChange(teacher.id, 'late')}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        markingStatus[teacher.id] === 'late'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => handleStatusChange(teacher.id, 'absent')}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        markingStatus[teacher.id] === 'absent'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowMarkModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleMarkAttendance} loading={saving} className="flex-1 gap-2">
                <CalendarCheck className="w-4 h-4" />
                Mark Attendance
              </Button>
            </div>
          </div>
        </BaseModal>
    </div>
  );
};

export default TeacherAttendancePage;

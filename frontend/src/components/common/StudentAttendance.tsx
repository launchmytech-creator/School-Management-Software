import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AttendanceStatsGrid from '../../components/common/AttendanceStatsGrid';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useTeacherAllocations } from '../../hooks/queries/useTeachers';
import { useAllStudents } from '../../hooks/queries/useStudents';
import { useClassAttendance, useMarkAttendance } from '../../hooks/queries/useAttendance';
import { useHolidays } from '../../hooks/queries/useHolidays';
import { type Class } from '../../types/class';
import { type MarkAttendanceDto } from '../../services/attendanceService';
import { Users, CheckCircle, XCircle, AlertCircle, CalendarCheck, Loader2, ShieldOff } from 'lucide-react';
import { formatDate, getLocalDateString } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';

type AttendanceStatus = 'present' | 'absent';

interface StudentAttendanceProps {
  layout: 'teacher' | 'accountant';
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({ layout }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceStatus>>(new Map());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const teacherId = user?.id as number;
  const isTeacher = layout === 'teacher';

  const { data: allocations = [] } = useTeacherAllocations(
    teacherId,
    selectedYear?.id ? Number(selectedYear?.id) : undefined
  );
  
  const inchargeClasses = useMemo(() => {
    const classIds = [...new Set(allocations.map(a => a.classId))];
    return classIds.map(id => {
      const allocation = allocations.find(a => a.classId === id);
      return {
        id: String(id),
        name: allocation?.className || 'Unknown',
        section: allocation?.classSection || null,
      } as Class;
    });
  }, [allocations]);

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const { data: allStudents = [] } = useAllStudents();
  const { data: existingAttendance = [] } = useClassAttendance(
    selectedClass ? parseInt(selectedClass.id) : 0,
    selectedDate
  );
  const { data: holidays = [] } = useHolidays(
    selectedYear?.id ? Number(selectedYear.id) : undefined
  );
  
  const markAttendance = useMarkAttendance();

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const classId = parseInt(selectedClass.id);
    return allStudents.filter(s => s.currentClassId === classId);
  }, [allStudents, selectedClass]);

  const students = classStudents;

  React.useEffect(() => {
    if (existingAttendance.length > 0) {
      const records = new Map<number, AttendanceStatus>();
      existingAttendance.forEach(record => {
        if (record.status === 'present' || record.status === 'absent') {
          records.set(record.studentId, record.status);
        }
      });
      setAttendanceRecords(records);
      setHasChanges(false);
    } else if (existingAttendance.length === 0 && classStudents.length > 0 && !hasChanges) {
      const initialRecords = new Map<number, AttendanceStatus>();
      classStudents.forEach(s => {
        initialRecords.set(s.id, 'present');
      });
      setAttendanceRecords(initialRecords);
    }
  }, [existingAttendance, classStudents]);

  React.useEffect(() => {
    if (isTeacher && inchargeClasses.length === 1 && !selectedClass) {
      setSelectedClass(inchargeClasses[0]);
    }
  }, [inchargeClasses, selectedClass, isTeacher]);

  const isHoliday = (date: string) => holidays.some(h => h.holidayDate === date);
  const isSunday = (date: string) => new Date(date).getDay() === 0;
  const getHolidayInfo = (date: string) => holidays.find(h => h.holidayDate === date);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const selected = inchargeClasses.find(c => c.id === classId) || allClasses.find(c => c.id === classId) || null;
    setSelectedClass(selected);
    setHasChanges(false);
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    const newRecords = new Map<number, AttendanceStatus>();
    students.forEach(s => {
      newRecords.set(s.id, 'present');
    });
    setAttendanceRecords(newRecords);
    setHasChanges(true);
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    students.forEach(s => {
      const status = attendanceRecords.get(s.id);
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
    });
    return { total: students.length, present, absent };
  }, [students, attendanceRecords]);

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceRecords.get(s.id) || 'present',
    }));

    const data: MarkAttendanceDto = {
      classId: parseInt(selectedClass.id),
      attendanceDate: selectedDate,
      records,
    };

    try {
      await markAttendance.mutateAsync(data);
      showNotification('Attendance marked successfully!', 'success');
      setHasChanges(false);
      setShowConfirmModal(false);
    } catch (error: any) {
      if (error.response?.status === 403) {
        showNotification(error.response?.data?.message || 'You are not authorized to mark attendance for this class', 'error');
      } else {
        showNotification('Failed to mark attendance', 'error');
      }
    }
  };

  const isDateInFuture = selectedDate > getLocalDateString();
  const isHolidayDate = isHoliday(selectedDate);
  const isSundayDate = isSunday(selectedDate);
  const cannotMarkAttendance = isDateInFuture || isHolidayDate || isSundayDate;

  const basePath = isTeacher ? '/teacher' : '/accountant';
  const currentClassName = selectedClass?.name;
  const hasSelectedClass = !!selectedClass;
  const loadingClasses = false;

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      {isTeacher && (
        <PageHeader 
          title="Student Attendance"
          subtitle="Mark and manage attendance for your classes"
          breadcrumb={{
            links: [
              { label: "People", href: `${basePath}/students` },
              { label: "Attendance", active: true }
            ]
          }}
          actions={[
            {
              label: "Mark All Present",
              icon: CheckCircle,
              onClick: handleMarkAllPresent,
              disabled: students.length === 0 || !hasChanges || cannotMarkAttendance
            }
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
              { label: "Attendance", active: true }
            ]
          }}
          actions={[
            {
              label: "Mark All Present",
              icon: CheckCircle,
              onClick: handleMarkAllPresent,
              disabled: students.length === 0 || !hasChanges || cannotMarkAttendance
            }
          ]}
        />
      )}

      {isHolidayDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500">celebration</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Holiday: {getHolidayInfo(selectedDate)?.description}
            </p>
            <p className="text-xs text-amber-600">Attendance cannot be marked on holidays</p>
          </div>
        </div>
      )}

      {isSundayDate && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-slate-500">weekend</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Sunday</p>
            <p className="text-xs text-slate-500">Attendance cannot be marked on Sundays</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isTeacher ? (
          <>
            {inchargeClasses.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-3">Class</label>
                <div className="flex items-start gap-2 flex-wrap">
                  {inchargeClasses.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedClass?.id === cls.id
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls.name} {cls.section ? `- Section ${cls.section}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {inchargeClasses.length === 1 && selectedClass && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Class:</label>
                <span className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200">
                  {selectedClass.name} {selectedClass.section ? `- Section ${selectedClass.section}` : ''}
                </span>
              </div>
            )}

            {inchargeClasses.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 md:col-span-2">
                <div className="flex items-center gap-3 text-amber-600">
                  <ShieldOff className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    You are not assigned as incharge for any class.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Class:</label>
            <select
              value={selectedClass?.id || ''}
              onChange={handleClassChange}
              disabled={loadingClasses}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">{loadingClasses ? 'Loading classes...' : 'Select a class'}</option>
              {allClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- Section ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Attendance Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getLocalDateString()}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Attendance has already been marked for this date. You can update it below.
          </p>
        </div>
      )}

      {hasSelectedClass && <AttendanceStatsGrid stats={stats} />}

      {hasSelectedClass ? (
        students.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const currentStatus = attendanceRecords.get(student.id) || 'present';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-600">
                            {student.rollNumber || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                              {student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {student.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            currentStatus === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {getStatusIcon(currentStatus)}
                            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {(['present', 'absent'] as AttendanceStatus[]).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`p-2 rounded-lg transition-colors ${
                                  currentStatus === status 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'hover:bg-slate-100 text-slate-400'
                                }`}
                                title={status.charAt(0).toUpperCase() + status.slice(1)}
                              >
                                {status === 'present' && <CheckCircle className="w-4 h-4" />}
                                {status === 'absent' && <XCircle className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleMarkAllPresent}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={!hasChanges}
              >
                Reset to All Present
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!hasChanges || isDateInFuture || cannotMarkAttendance || markAttendance.isPending}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
                  hasChanges && !isDateInFuture && !cannotMarkAttendance
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {markAttendance.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {existingAttendance.length > 0 ? 'Update Attendance' : 'Mark Attendance'}
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No students found"
            description={`No students are enrolled in ${currentClassName || 'this class'} for the selected academic year.`}
          />
        )
      ) : (
        isTeacher && inchargeClasses.length === 0 ? (
          <EmptyState
            icon={ShieldOff}
            title="No classes assigned"
            description="You are not assigned as class incharge for any class. Contact your administrator to assign you as incharge."
          />
        ) : !isTeacher ? (
          <EmptyState
            icon={Users}
            title="Please select a class"
            description="Choose a class to mark attendance"
          />
        ) : null
      )}

      <BaseModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Attendance"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            You are about to mark attendance for <span className="font-semibold">{formatDate(selectedDate)}</span> in <span className="font-semibold">{currentClassName}</span>.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Students:</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Present:</span>
              <span className="font-semibold text-emerald-700">{stats.present}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-rose-600">Absent:</span>
              <span className="font-semibold text-rose-700">{stats.absent}</span>
            </div>
          </div>

          {existingAttendance.length > 0 && (
            <p className="text-sm text-amber-600">
              This will update the existing attendance record.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={markAttendance.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={markAttendance.isPending}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {markAttendance.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {markAttendance.isPending ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );

  return renderContent();
};

export default StudentAttendance;

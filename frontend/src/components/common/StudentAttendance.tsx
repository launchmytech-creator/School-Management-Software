import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AttendanceStatsGrid from '../../components/common/AttendanceStatsGrid';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, type AttendanceRecord, type MarkAttendanceDto } from '../../services/attendanceService';
import { classService } from '../../services/classService';
import { type Class } from '../../types/class';
import { useAllStudents } from '../../hooks/queries/useStudents';
import { type Student } from '../../types/student';
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
  
  const [saving, setSaving] = useState(false);
  const [inchargeClasses, setInchargeClasses] = useState<Class[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceStatus>>(new Map());
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const teacherId = user?.id as number;
  const isTeacher = layout === 'teacher';

  const { data: allStudents = [] } = useAllStudents();

  const classStudents = useMemo(() => {
    let classId: number | undefined;
    
    if (selectedClass) {
      classId = parseInt(selectedClass.id);
    }
    
    if (!classId) return [];
    return allStudents.filter(s => s.currentClassId === classId);
  }, [allStudents, selectedClass]);

  useEffect(() => {
    if (classStudents.length > 0) {
      setStudents(classStudents);
      
      const initialRecords = new Map<number, AttendanceStatus>();
      classStudents.forEach(s => {
        initialRecords.set(s.id, 'present');
      });
      setAttendanceRecords(initialRecords);
      setHasChanges(false);
    } else if (!selectedClass) {
      setStudents([]);
    }
  }, [classStudents, selectedClass]);

  const fetchInchargeClasses = useCallback(async () => {
    if (!teacherId || !isTeacher) return;
    setLoadingClasses(true);
    try {
      const data = await classService.getClassesByIncharge(teacherId, selectedYear?.id);
      setInchargeClasses(data);
    } catch {
      showNotification('Failed to fetch your classes', 'error');
    } finally {
      setLoadingClasses(false);
    }
  }, [teacherId, isTeacher, selectedYear, showNotification]);

  const fetchAllClasses = useCallback(async () => {
    if (isTeacher) return;
    setLoadingClasses(true);
    try {
      const data = await classService.getClasses(selectedYear?.id);
      setAllClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    } finally {
      setLoadingClasses(false);
    }
  }, [isTeacher, selectedYear, showNotification]);

  const fetchExistingAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const data = await attendanceService.getClassAttendanceByDate(
        parseInt(selectedClass.id),
        selectedDate
      );
      setExistingAttendance(data);
      
      if (data.length > 0) {
        const records = new Map<number, AttendanceStatus>();
        data.forEach(record => {
          if (record.status === 'present' || record.status === 'absent') {
            records.set(record.studentId, record.status);
          }
        });
        setAttendanceRecords(records);
      }
    } catch {
      showNotification('Failed to fetch existing attendance', 'error');
    }
  }, [selectedClass, selectedDate, showNotification]);

  useEffect(() => {
    if (isTeacher) {
      fetchInchargeClasses();
    } else {
      fetchAllClasses();
    }
  }, [isTeacher, fetchInchargeClasses, fetchAllClasses]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate, fetchExistingAttendance]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const selected = inchargeClasses.find(c => c.id === classId) || allClasses.find(c => c.id === classId) || null;
    setSelectedClass(selected);
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
    
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendanceRecords.get(s.id) || 'present',
      }));

      const data: MarkAttendanceDto = {
        classId: parseInt(selectedClass.id),
        attendanceDate: selectedDate,
        records,
      };

      await attendanceService.markAttendance(data);
      showNotification('Attendance marked successfully!', 'success');
      setHasChanges(false);
      setShowConfirmModal(false);
      setExistingAttendance(records.map((r, i) => ({
        id: Date.now() + i,
        studentId: r.studentId,
        studentName: students.find(s => s.id === r.studentId)?.fullName || '',
        classId: parseInt(selectedClass.id),
        className: selectedClass.name,
        attendanceDate: selectedDate,
        status: r.status,
      })));
    } catch (error: any) {
      if (error.response?.status === 403) {
        showNotification(error.response?.data?.message || 'You are not authorized to mark attendance for this class', 'error');
      } else {
        showNotification('Failed to mark attendance', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const isDateInFuture = selectedDate > getLocalDateString();
  const basePath = isTeacher ? '/teacher' : '/accountant';
  const currentClassName = selectedClass?.name;
  const hasSelectedClass = !!selectedClass;
  const teacherClasses = isTeacher ? inchargeClasses : allClasses;

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      {isTeacher && (
        <PageHeader 
          title="Student Attendance"
          subtitle="Mark and manage attendance for your classes"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: `${basePath}/dashboard` },
              { label: "Attendance", active: true }
            ]
          }}
          actions={[
            {
              label: "Mark All Present",
              icon: CheckCircle,
              onClick: handleMarkAllPresent,
              disabled: students.length === 0 || !hasChanges
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
              { label: "Dashboard", href: `${basePath}/dashboard` },
              { label: "Attendance", active: true }
            ]
          }}
          actions={[
            {
              label: "Mark All Present",
              icon: CheckCircle,
              onClick: handleMarkAllPresent,
              disabled: students.length === 0 || !hasChanges
            }
          ]}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {isTeacher ? 'Select Your Class (Incharge)' : 'Select Class'}
          </label>
          <select
            value={selectedClass?.id || ''}
            onChange={handleClassChange}
            disabled={loadingClasses}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">{loadingClasses ? 'Loading classes...' : 'Select a class'}</option>
            {teacherClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.section ? `- Section ${cls.section}` : ''}
                {isTeacher && cls.inchargeName ? ` (Incharge: ${cls.inchargeName})` : ''}
              </option>
            ))}
          </select>
          {isTeacher && inchargeClasses.length === 0 && !loadingClasses && (
            <p className="text-xs text-amber-600 mt-2">
              You are not assigned as incharge for any class.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="block text-sm font-bold text-slate-700 mb-2">Attendance Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getLocalDateString()}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={!hasChanges || isDateInFuture || saving}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
                  hasChanges && !isDateInFuture
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
        isTeacher && inchargeClasses.length === 0 && !loadingClasses ? (
          <EmptyState
            icon={ShieldOff}
            title="No classes assigned"
            description="You are not assigned as class incharge for any class. Contact your administrator to assign you as incharge."
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Please select a class"
            description={isTeacher ? "Choose a class you are incharge of to mark attendance" : "Choose a class to mark attendance"}
          />
        )
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
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );

  return renderContent();
};

export default StudentAttendance;

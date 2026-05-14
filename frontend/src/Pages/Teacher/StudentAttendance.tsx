import React, { useState, useEffect, useCallback } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AttendanceStatsGrid from '../../components/common/AttendanceStatsGrid';
import ClassSelect from '../../components/common/ClassSelect';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, type AttendanceRecord, type MarkAttendanceDto } from '../../services/attendanceService';
import { teacherService } from '../../services/teacherService';
import { type TeacherAllocation } from '../../types/teacher';
import { studentService } from '../../services/studentService';
import { type Student } from '../../types/student';
import { Users, CheckCircle, XCircle, AlertCircle, CalendarCheck, Loader2 } from 'lucide-react';
import { formatDate, getLocalDateString } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';

type AttendanceStatus = 'present' | 'absent';

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  
  const [saving, setSaving] = useState(false);
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherAllocation | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceStatus>>(new Map());
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const teacherId = user?.id as number;

  const fetchAllocations = useCallback(async () => {
    if (!teacherId) return;
    try {
      const data = await teacherService.getAllocationsByTeacher(teacherId);
      setAllocations(data);
    } catch {
      showNotification('Failed to fetch your class allocations', 'error');
    }
  }, [teacherId, showNotification]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass?.classId || !selectedYear?.id) return;
    try {
      const response = await studentService.getStudents({
        classId: String(selectedClass.classId),
        academicYear: String(selectedYear.id)
      });
      const data = response.data;
      setStudents(data);
      
      const initialRecords = new Map<number, AttendanceStatus>();
      data.forEach(s => {
        initialRecords.set(s.id, 'present');
      });
      setAttendanceRecords(initialRecords);
      setHasChanges(false);
    } catch {
      showNotification('Failed to fetch students', 'error');
    }
  }, [selectedClass, selectedYear, showNotification]);

  const fetchExistingAttendance = useCallback(async () => {
    if (!selectedClass?.classId || !selectedDate) return;
    try {
      const data = await attendanceService.getClassAttendanceByDate(
        selectedClass.classId,
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
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (selectedClass && selectedYear) {
      fetchStudents();
    } else {
      setStudents([]);
      setAttendanceRecords(new Map());
    }
  }, [selectedClass, selectedYear, fetchStudents]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate, fetchExistingAttendance]);

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

  const stats = {
    total: students.length,
    present: students.filter(s => attendanceRecords.get(s.id) === 'present').length,
    absent: students.filter(s => attendanceRecords.get(s.id) === 'absent').length,
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendanceRecords.get(s.id) || 'present',
      }));

      const data: MarkAttendanceDto = {
        classId: selectedClass.classId,
        attendanceDate: selectedDate,
        records,
      };

      await attendanceService.markAttendance(data);
      showNotification('Attendance marked successfully!', 'success');
      setHasChanges(false);
      setShowConfirmModal(false);
      fetchExistingAttendance();
    } catch {
      showNotification('Failed to mark attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDateInFuture = selectedDate > getLocalDateString();

  return (
    <TeacherLayout title="Mark Attendance">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Student Attendance"
          subtitle="Mark and manage attendance for your classes"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/teacher/dashboard" },
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Class</label>
            <ClassSelect
              allocations={allocations}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select a class"
            />
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

        {selectedClass && <AttendanceStatsGrid stats={stats} />}

        {selectedClass ? (
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
              description={`No students are enrolled in ${selectedClass?.className || 'this class'} for the selected academic year.`}
            />
          )
        ) : (
          <EmptyState
            icon={Users}
            title="Please select a class"
            description="Choose a class from your allocations to mark attendance"
          />
        )}

        <BaseModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Attendance"
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              You are about to mark attendance for <span className="font-semibold">{formatDate(selectedDate)}</span> in <span className="font-semibold">{selectedClass?.className}</span>.
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
    </TeacherLayout>
  );
};

export default StudentAttendance;

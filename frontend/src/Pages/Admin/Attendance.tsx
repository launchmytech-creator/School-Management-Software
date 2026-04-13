import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useClassAttendance } from '../../hooks/queries/useAttendance';
import { Users, CheckCircle, XCircle, Clock, CalendarCheck } from 'lucide-react';
import { formatDate, getLocalDateString } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { SkeletonTable } from '../../components/common/Skeleton';

const Attendance: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [showMarkModal, setShowMarkModal] = useState(false);

  const { data: classes = [] } = useClasses(selectedYear?.id);
  const { data: attendance = [], isLoading } = useClassAttendance(
    selectedClass ? parseInt(selectedClass) : 0,
    selectedDate
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    attendance.forEach(a => {
      if (a.status === 'present') present++;
      else if (a.status === 'absent') absent++;
      else if (a.status === 'late') late++;
    });
    return { total: attendance.length, present, absent, late };
  }, [attendance]);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  return (
    <div className="space-y-6 pb-12">
        <PageHeader 
          title="Student Attendance"
          subtitle="Track and manage daily student attendance"
          breadcrumb={{
            links: [
              { label: "People", href: "/admin/students" },
              { label: "Attendance", active: true }
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

        <FilterBar 
          searchTerm=""
          onSearchChange={() => {}}
          onReset={() => {}}
          searchPlaceholder="Search students..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - Section {cls.section || 'A'}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FilterBar>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
                <p className="text-sm text-emerald-600">Present ({getPercentage(stats.present)}%)</p>
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
                <p className="text-sm text-rose-600">Absent ({getPercentage(stats.absent)}%)</p>
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
                <p className="text-sm text-amber-600">Late ({getPercentage(stats.late)}%)</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable columns={3} rows={8} />
        ) : selectedClass ? (
          attendance.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                              {record.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {record.studentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{record.className}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {getStatusIcon(record.status)}
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No attendance records"
              description={`No attendance records found for ${formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}`}
              action={{
                label: "Mark Attendance",
                icon: CalendarCheck,
                onClick: () => setShowMarkModal(true)
              }}
            />
          )
        ) : (
          <EmptyState
            icon={Users}
            title="Select a class"
            description="Choose a class and date to view attendance records"
          />
        )}

        <BaseModal
          isOpen={showMarkModal}
          onClose={() => setShowMarkModal(false)}
          title="Mark Attendance"
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Select a class to mark attendance for <span className="font-semibold">{formatDate(selectedDate)}</span>
            </p>
            <div className="space-y-2">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls.id);
                    setShowMarkModal(false);
                    showNotification('Attendance marking feature coming soon', 'info');
                  }}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{cls.name}</span>
                    <span className="text-slate-500 ml-2">Section {cls.section || 'A'}</span>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-blue-500">Select →</span>
                </button>
              ))}
            </div>
            {classes.length === 0 && (
              <p className="text-center text-slate-400 py-4">No classes available</p>
            )}
          </div>
        </BaseModal>
      </div>
    
  );
};

export default Attendance;

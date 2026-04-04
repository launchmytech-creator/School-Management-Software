import React, { useState, useMemo } from 'react';
import ParentLayout from '../../layouts/ParentLayout';
import { useAuth } from '../../context/AuthContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useParentDashboard } from '../../hooks/queries';

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} MINUTES AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HOURS AGO`;
  return `${Math.floor(hrs / 24)} DAYS AGO`;
};

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface AttendanceDay {
  day: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'future' | null;
}

const AttendanceDay: React.FC<AttendanceDay> = ({ day, date, status }) => {
  const base = 'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2';
  const circle =
    status === 'present' ? `${base} bg-emerald-500 text-white` :
    status === 'absent'  ? `${base} bg-rose-500 text-white` :
    status === 'late'    ? `${base} bg-amber-400 text-white` :
                           `${base} bg-slate-100 text-slate-300`;
  const icon =
    status === 'present' ? 'check' :
    status === 'absent'  ? 'close' :
    status === 'late'    ? 'schedule' : 'remove';

  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{day}</p>
      <div className={circle}>
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">{date}</p>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}> = ({ label, icon, iconColor, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <span
        className={`material-symbols-outlined text-[20px] ${iconColor}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
    </div>
    {children}
  </div>
);

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { data, isLoading } = useParentDashboard(user?.id ?? 0);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const children = data?.children ?? [];
  const announcements = data?.recentAnnouncements ?? [];

  const selectedChild = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return children.find(c => c.student.id === selectedChildId) || children[0];
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  const totalDays = selectedChild?.recent_attendance.length ?? 0;
  const presentDays = selectedChild?.recent_attendance.filter(a => a.status === 'present').length ?? 0;
  const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const recentAtt = selectedChild?.recent_attendance.slice(-6) ?? [];
  const weekSlots: AttendanceDay[] = WEEK_DAYS.map((day, i) => {
    const rec = recentAtt[i];
    if (!rec) return { day, date: '', status: 'future' as const };
    const d = new Date(rec.attendance_date);
    const dateLabel = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    return { day, date: dateLabel, status: rec.status as 'present' | 'absent' | 'late' };
  });

  const hasPendingFees = selectedChild && 
    (parseFloat(selectedChild.fee_summary.pending_fees) > 0 || parseFloat(selectedChild.fee_summary.total_due) > 0);

  if (isLoading) {
    return (
      <ParentLayout title="Parent Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
          </div>
        </div>
      </ParentLayout>
    );
  }

  if (children.length === 0) {
    return (
      <ParentLayout title="Parent Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">family_restroom</span>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Students Linked</h3>
            <p className="text-sm text-slate-400">Contact school administration to link your children.</p>
          </div>
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Parent Dashboard">
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-1 border-b border-slate-200">
          {children.map((child) => (
            <button
              key={child.student.id}
              onClick={() => setSelectedChildId(child.student.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                selectedChild?.student.id === child.student.id
                  ? 'border-[#4A9FD4] text-[#4A9FD4]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_circle
              </span>
              {child.student.full_name.split(' ')[0]}
            </button>
          ))}
        </div>

        {selectedChild && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild.student.id}`}
                  alt={selectedChild.student.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900">{selectedChild.student.full_name}</h2>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[14px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    {selectedChild.student.class_name || 'N/A'}
                    {selectedChild.student.class_section ? ` - Section ${selectedChild.student.class_section}` : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[14px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                    Academic Year {selectedYear?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Attendance Ratio" icon="person_check" iconColor="text-blue-400">
                <p className="text-2xl font-black text-slate-900">
                  {presentDays}/{totalDays}
                  <span className="text-sm font-bold text-emerald-500 ml-2">{pct}%</span>
                </p>
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </StatCard>

              <StatCard label="Latest Exam Score" icon="star" iconColor="text-amber-400">
                <p className="text-2xl font-black text-slate-900">—</p>
                <p className="text-xs text-slate-400 mt-1">No exam data</p>
              </StatCard>

              <StatCard label="Fee Status" icon="account_balance_wallet" iconColor="text-teal-400">
                <p className={`text-2xl font-black ${hasPendingFees ? 'text-rose-600' : 'text-slate-900'}`}>
                  {hasPendingFees ? 'Pending' : 'Paid'}
                </p>
                {hasPendingFees ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    {selectedChild.fee_summary.pending_fees} DUE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    UP TO DATE
                  </span>
                )}
              </StatCard>

              <StatCard label="Syllabus" icon="menu_book" iconColor="text-purple-400">
                <p className="text-2xl font-black text-slate-900">—</p>
                <p className="text-xs text-slate-400 mt-1">No syllabus data</p>
              </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900">Recent Attendance</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Present
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Absent
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {weekSlots.map((slot) => (
                    <AttendanceDay
                      key={slot.day}
                      day={slot.day}
                      date={slot.date}
                      status={slot.status}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
                {hasPendingFees ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-rose-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">Payment Due</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pending fees: {selectedChild.fee_summary.pending_fees}
                    </p>
                    <button className="mt-4 text-xs font-bold text-[#4A9FD4] hover:underline flex items-center gap-1">
                      View Fee Details
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-emerald-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">All Clear!</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      There are no pending fee payments. Great job!
                    </p>
                    <button className="mt-4 text-xs font-bold text-[#4A9FD4] hover:underline flex items-center gap-1">
                      View Receipt History
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">📢</span>
                <h3 className="font-bold text-slate-900">Latest Announcements</h3>
              </div>
              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">campaign</span>
                  <p className="text-sm text-slate-400">No announcements at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="border-l-4 border-amber-400 pl-4 py-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{ann.content}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <button className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                              Download Circular
                            </button>
                            <button className="text-xs font-semibold text-[#4A9FD4] hover:underline">
                              Read More
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex-shrink-0">
                          {timeAgo(ann.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ParentLayout>
  );
};

export default ParentDashboard;

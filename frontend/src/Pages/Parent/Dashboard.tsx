import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentLayout from '../../layouts/ParentLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { parentService } from '../../services/parentService';
import { feeService } from '../../services/feeService';
import { attendanceService } from '../../services/attendanceService';
import { announcementService } from '../../services/announcementService';
import type { LinkedStudent } from '../../types/parent';
import type { FeeTransaction } from '../../services/feeService';
import type { AttendanceRecord } from '../../services/attendanceService';
import type { Announcement } from '../../services/announcementService';
import { formatDate } from '../../lib/utils';

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} MINUTES AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HOURS AGO`;
  return `${Math.floor(hrs / 24)} DAYS AGO`;
};

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const StatCard: React.FC<{
  label: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ label, icon, iconColor, children, onClick }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-[#4A9FD4] hover:shadow-md transition-all' : ''}`}
    onClick={onClick}
  >
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

interface AttendanceDayProps {
  day: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

const AttendanceDay: React.FC<AttendanceDayProps> = ({ day, date, status }) => {
  const base = 'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2';
  const circle =
    status === 'present' ? `${base} bg-emerald-500 text-white` :
    status === 'absent'  ? `${base} bg-rose-500 text-white` :
                           `${base} bg-amber-400 text-white`;
  const icon =
    status === 'present' ? 'check' :
    status === 'absent'  ? 'close' : 'schedule';

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

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<LinkedStudent[]>([]);
  const [selectedChild, setSelectedChild] = useState<LinkedStudent | null>(null);
  const [fees, setFees] = useState<FeeTransaction[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schoolOpenDays, setSchoolOpenDays] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchChildren = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await parentService.getParentChildren(Number(user.id));
      setChildren(data);
      if (data.length > 0) setSelectedChild(data[0]);
    } catch {
      showNotification('Failed to load children', 'error');
    }
  }, [user?.id, showNotification]);

  const fetchChildData = useCallback(async () => {
    if (!selectedChild) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    try {
      const [feeData, attData, openDays] = await Promise.all([
        feeService.getStudentFeeTransactions(selectedChild.id),
        attendanceService.getAttendance({ studentId: selectedChild.id, startDate: monthStart, endDate: monthEnd }),
        attendanceService.getSchoolOpenDays(year, month + 1),
      ]);
      setFees(feeData);
      setAttendance(attData);
      setSchoolOpenDays(openDays);
    } catch {
      // silently fail
    }
  }, [selectedChild]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await announcementService.getAnnouncements({ isActive: true, limit: 3 });
      setAnnouncements(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchChildren();
      await fetchAnnouncements();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchChildData();
  }, [selectedChild]);

  const totalDays   = schoolOpenDays;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const pct         = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const feeStatus   = fees.length === 0 ? 'N/A' :
                      fees.every(f => f.status === 'paid') ? 'Paid' :
                      fees.some(f => f.status === 'partial') ? 'Partial' : 'Pending';
  const feeIsPaid   = feeStatus === 'Paid';
  const pendingFees = fees.filter(f => f.status !== 'paid' && f.status !== 'waived');

  // Parse YYYY-MM-DD safely without UTC shift
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Last 6 attendance records, sorted oldest→newest, no padding
  const weekSlots = [...attendance]
    .sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate))
    .slice(-6)
    .map(rec => {
      const d = parseLocalDate(rec.attendanceDate);
      return {
        key: rec.attendanceDate,
        day: DAY_LABELS[d.getDay()],
        date: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`,
        status: rec.status as 'present' | 'absent' | 'late',
      };
    });

  if (loading) {
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

        {/* Child Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                selectedChild?.id === child.id
                  ? 'border-[#4A9FD4] text-[#4A9FD4]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_circle
              </span>
              {child.fullName.split(' ')[0]}
            </button>
          ))}
        </div>

        {selectedChild && (
          <>
            {/* Student Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild.id}`}
                  alt={selectedChild.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900">{selectedChild.fullName}</h2>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[14px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    {selectedChild.className || 'N/A'}
                    {selectedChild.rollNumber ? ` | Roll No: ${selectedChild.rollNumber}` : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[14px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                    Academic Year {selectedYear?.name || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Attendance Ratio" icon="person_check" iconColor="text-blue-400" onClick={() => navigate('/parent/attendance')}>
                <p className="text-2xl font-black text-slate-900">
                  {presentDays}/{totalDays}
                  <span className="text-sm font-bold text-emerald-500 ml-2">{pct}%</span>
                </p>
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">This month · school days</p>
                <p className="text-[10px] text-[#4A9FD4] font-semibold mt-1 flex items-center gap-0.5">
                  View details
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </p>
              </StatCard>

              <StatCard label="Latest Exam Score" icon="star" iconColor="text-amber-400">
                <p className="text-2xl font-black text-slate-900">—</p>
                <p className="text-xs text-slate-400 mt-1">No exam data</p>
              </StatCard>

              <StatCard label="Fee Status" icon="account_balance_wallet" iconColor="text-teal-400">
                <p className={`text-2xl font-black ${feeIsPaid ? 'text-slate-900' : 'text-rose-600'}`}>
                  {feeStatus}
                </p>
                {feeIsPaid ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    UP TO DATE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    {pendingFees.length} PENDING
                  </span>
                )}
              </StatCard>

              <StatCard label="Syllabus" icon="menu_book" iconColor="text-purple-400">
                <p className="text-2xl font-black text-slate-900">—</p>
                <p className="text-xs text-slate-400 mt-1">No syllabus data</p>
              </StatCard>
            </div>

            {/* Attendance + Fee Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900">Recent Attendance</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Present
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Absent
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/parent/attendance')}
                      className="text-xs font-bold text-[#4A9FD4] hover:underline flex items-center gap-0.5"
                    >
                      View All
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {attendance.length === 0 ? (
                    <div className="col-span-6 text-center py-6">
                      <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">event_busy</span>
                      <p className="text-xs text-slate-400">No attendance records this month</p>
                    </div>
                  ) : (
                    weekSlots.map((slot) => (
                      <AttendanceDay
                        key={slot.key}
                        day={slot.day}
                        date={slot.date}
                        status={slot.status}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Fee Status</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    feeIsPaid ? 'bg-emerald-50 text-emerald-600' :
                    feeStatus === 'Partial' ? 'bg-amber-50 text-amber-600' :
                    feeStatus === 'N/A' ? 'bg-slate-100 text-slate-400' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {feeStatus.toUpperCase()}
                  </span>
                </div>

                {fees.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">receipt_long</span>
                    <p className="text-xs text-slate-400">No fee records found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Total Annual Fee</span>
                        <span className="text-sm font-bold text-slate-900">
                          ₹{fees.reduce((s, f) => s + f.amountDue, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Amount Paid</span>
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{fees.reduce((s, f) => s + f.amountPaid, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Amount Due</span>
                        <span className="text-sm font-bold text-rose-500">
                          ₹{fees.reduce((s, f) => s + Math.max(0, f.amountDue - f.amountPaid), 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {(() => {
                        const total = fees.reduce((s, f) => s + f.amountDue, 0);
                        const paid  = fees.reduce((s, f) => s + f.amountPaid, 0);
                        const pct   = total > 0 ? Math.round((paid / total) * 100) : 0;
                        return (
                          <div className="pt-1">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Paid</span><span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Next due */}
                    {pendingFees.length > 0 && pendingFees[0].dueDate && (
                      <div className="mt-4 bg-rose-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                        <div>
                          <p className="text-[10px] text-rose-400 font-semibold uppercase">Next Due</p>
                          <p className="text-xs font-bold text-rose-600">{formatDate(pendingFees[0].dueDate)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => navigate('/parent/fees')}
                  className="mt-4 text-xs font-bold text-[#4A9FD4] hover:underline flex items-center gap-1"
                >
                  View Details
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Announcements */}
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

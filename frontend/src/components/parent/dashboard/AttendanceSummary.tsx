import React from 'react';
import type { ChildOverview } from '../../../hooks/queries/useDashboard';

interface AttendanceSummaryProps {
  child: ChildOverview;
}

interface AttendanceDay {
  day: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'future' | null;
}

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const AttendanceDayIcon: React.FC<{ status: AttendanceDay['status'] }> = ({ status }) => {
  const base = "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2";
  const circle =
    status === 'present'
      ? `${base} bg-emerald-500 text-white`
      : status === 'absent'
        ? `${base} bg-rose-500 text-white`
        : status === 'late'
          ? `${base} bg-amber-400 text-white`
          : `${base} bg-slate-100 text-slate-300`;

  const icon =
    status === 'present'
      ? 'check'
      : status === 'absent'
        ? 'close'
        : status === 'late'
          ? 'schedule'
          : 'remove';

  return (
    <div className="text-center">
      <div className={circle}>
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
    </div>
  );
};

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ child }) => {
  const recentAtt = child.recent_attendance.slice(0, 6);
  
  const weekSlots: AttendanceDay[] = WEEK_DAYS.map((day, i) => {
    const rec = recentAtt[i];
    if (!rec) return { day, date: '', status: 'future' as const };
    const d = new Date(rec.attendance_date);
    const dateLabel = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    return {
      day,
      date: dateLabel,
      status: rec.status as 'present' | 'absent' | 'late'
    };
  });

  const presentDays = recentAtt.filter(a => a.status === 'present').length;
  const absentDays = recentAtt.filter(a => a.status === 'absent').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-900">Weekly Attendance</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Absent
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-2">
        {weekSlots.map((slot) => (
          <div key={slot.day}>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">
              {slot.day}
            </p>
            <AttendanceDayIcon status={slot.status} />
            <p className="text-[11px] text-slate-500 text-center">{slot.date || '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">{presentDays} Present</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-600">{absentDays} Absent</span>
        </div>
      </div>
    </div>
  );
};
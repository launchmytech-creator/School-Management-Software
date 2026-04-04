import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ParentLayout from '../../layouts/ParentLayout';
import { useAuth } from '../../context/AuthContext';
import { useParentChildren } from '../../hooks/queries';
import { attendanceService } from '../../services/attendanceService';
import { holidayService } from '../../services/holidayService';
import type { LinkedStudent } from '../../types/parent';
import type { AttendanceRecord } from '../../services/attendanceService';
import type { Holiday } from '../../services/holidayService';

// ── helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// ── circular progress ─────────────────────────────────────────────────────────

const CircularProgress: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const safePct = Math.min(100, Math.max(0, isNaN(pct) ? 0 : pct));
  const offset = circ - (safePct / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke="#22c55e" strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="70" y="66" textAnchor="middle" dominantBaseline="middle"
        fill="#111827" fontSize="22" fontWeight="800"
      >
        {safePct}%
      </text>
      <text
        x="70" y="86" textAnchor="middle" dominantBaseline="middle"
        fill="#6b7280" fontSize="9" fontWeight="600" letterSpacing="1"
      >
        ATTENDANCE
      </text>
    </svg>
  );
};

// ── main ──────────────────────────────────────────────────────────────────────

const today = new Date();
const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentAttendance: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;

  const [selected, setSelected]     = useState<LinkedStudent | null>(null);
  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays]     = useState<Holiday[]>([]);
  const [monthOpenDays, setMonthOpenDays] = useState<number>(0);

  // ── set initial child ───────────────────────────────────────────────────────
  useEffect(() => {
    if (children.length > 0 && !selected) {
      setSelected(children[0]);
    }
  }, [children, selected]);

  // ── fetch attendance for selected child ─────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!selected) return;
    const monthStart = toDateStr(viewYear, viewMonth, 1);
    const monthEnd = toDateStr(viewYear, viewMonth, getDaysInMonth(viewYear, viewMonth));
    try {
      const data = await attendanceService.getAttendance({
        studentId: selected.id,
        startDate: monthStart,
        endDate: monthEnd,
      });
      setRecords(data);
    } catch { setRecords([]); }
  }, [selected, viewYear, viewMonth]);

  // ── fetch holidays ──────────────────────────────────────────────────────────
  const fetchHolidays = useCallback(async () => {
    try {
      const data = await holidayService.getHolidays(viewYear);
      setHolidays(data);
    } catch { setHolidays([]); }
  }, [viewYear]);

  // ── fetch school open days ───────────────────────────────────────────────────
  const fetchSchoolOpenDays = useCallback(async () => {
    try {
      const count = await attendanceService.getSchoolOpenDays(viewYear, viewMonth + 1);
      setMonthOpenDays(count);
    } catch { /* ignore */ }
  }, [viewYear, viewMonth]);

  useEffect(() => { fetchAttendance(); fetchHolidays(); fetchSchoolOpenDays(); }, [fetchAttendance, fetchHolidays, fetchSchoolOpenDays]);

  // ── derived ─────────────────────────────────────────────────────────────────
  const recordMap = new Map(records.map(r => [r.attendanceDate.slice(0, 10), r.status]));
  const holidaySet = new Set(holidays.map(h => h.holidayDate.slice(0, 10)));

  // month summary
  const monthRecords = records.filter(r => {
    const d = new Date(r.attendanceDate);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const monthPresent = monthRecords.filter(r => r.status === 'present').length;
  const monthAbsent  = monthRecords.filter(r => r.status === 'absent').length;
  const monthPct     = monthOpenDays > 0 ? Math.round((monthPresent / monthOpenDays) * 100) : 0;

  const statusLabel = monthPct >= 90 ? 'EXCELLENT' : monthPct >= 75 ? 'GOOD' : 'NEEDS IMPROVEMENT';
  const statusColor = monthPct >= 90 ? 'bg-emerald-500' : monthPct >= 75 ? 'bg-amber-500' : 'bg-rose-500';

  // ── calendar grid ────────────────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const prevDays     = getDaysInMonth(viewYear, viewMonth - 1);

  // build 6×7 grid
  const cells: { day: number; month: 'prev' | 'cur' | 'next'; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, month: 'prev', dateStr: toDateStr(y, m, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'cur', dateStr: toDateStr(viewYear, viewMonth, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: next, month: 'next', dateStr: toDateStr(y, m, next) });
    next++;
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  if (childrenLoading) {
    return (
      <ParentLayout title="Attendance Tracker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Attendance Tracker">
      <div className="p-6 max-w-5xl mx-auto space-y-5 pb-24">

        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Attendance Tracker
          </button>
        </div>

        {/* Child selector tabs */}
        {children.length > 1 && (
          <div className="flex gap-2">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  selected?.id === c.id
                    ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {c.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Monthly overview card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center">
          <CircularProgress pct={monthPct} />
          <h2 className="text-lg font-black text-slate-900 mt-4">Monthly Attendance Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Present:{' '}
            <span className="text-emerald-500 font-bold">{monthPresent} days</span>
            {' | '}Absent:{' '}
            <span className="text-rose-500 font-bold">{monthAbsent} days</span>
            {' | '}School Open:{' '}
            <span className="text-slate-700 font-bold">{monthOpenDays} days</span>
          </p>
        </div>

        {/* Calendar card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="material-symbols-outlined text-[18px] text-[#4A9FD4]" style={{ fontVariationSettings: "'FILL' 1" }}>
                calendar_month
              </span>
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const isCur     = cell.month === 'cur';
              const status    = isCur ? recordMap.get(cell.dateStr) : undefined;
              const isHoliday = isCur && holidaySet.has(cell.dateStr);
              const isToday   = cell.dateStr === todayStr;
              const isSunday  = idx % 7 === 0;

              let bg = '';
              let label: string | null = null;

              if (isCur) {
                if (isHoliday) {
                  bg = 'bg-blue-50';
                  label = 'HOLIDAY';
                } else if (status === 'present') {
                  bg = 'bg-emerald-50';
                  label = 'PRESENT';
                } else if (status === 'absent') {
                  bg = 'bg-rose-50';
                  label = 'ABSENT';
                } else if (status === 'late') {
                  bg = 'bg-amber-50';
                  label = 'LATE';
                } else if (isSunday) {
                  bg = 'bg-slate-50';
                }
              }

              return (
                <div
                  key={idx}
                  className={`relative min-h-[72px] border border-slate-100 p-1.5 ${bg} ${
                    isToday ? 'ring-2 ring-inset ring-[#4A9FD4]' : ''
                  }`}
                >
                  {/* day number */}
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-bold leading-none ${
                      !isCur ? 'text-slate-300' :
                      isToday ? 'text-[#4A9FD4]' :
                      'text-slate-700'
                    }`}>
                      {cell.day}
                    </span>
                    {isToday ? (
                      <span className="text-[8px] font-black bg-[#4A9FD4] text-white px-1 py-0.5 rounded leading-none">
                        TODAY
                      </span>
                    ) : label && isCur ? (
                      <span className={`text-[8px] font-black px-1 py-0.5 rounded leading-none ${
                        label === 'PRESENT' ? 'text-emerald-600' :
                        label === 'ABSENT'  ? 'text-rose-600' :
                        label === 'LATE'    ? 'text-amber-600' :
                        label === 'HOLIDAY' ? 'text-blue-500' : ''
                      }`}>
                        {label}
                      </span>
                    ) : null}
                  </div>
                  {/* bottom color bar */}
                  {isCur && (status || isHoliday) && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b ${
                      status === 'present' ? 'bg-emerald-400' :
                      status === 'absent'  ? 'bg-rose-400' :
                      status === 'late'    ? 'bg-amber-400' :
                      isHoliday           ? 'bg-blue-300' : ''
                    }`} />
                  )}
                  {/* holiday label in center */}
                  {isHoliday && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-bold text-blue-400 rotate-[-15deg] opacity-60 uppercase tracking-widest">
                        Holiday
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-1 flex-wrap">
          {[
            { color: 'bg-emerald-400', label: 'Present' },
            { color: 'bg-rose-400',    label: 'Absent'  },
            { color: 'bg-amber-400',   label: 'Late'    },
            { color: 'bg-blue-300',    label: 'Holiday' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Month summary sticky footer */}
      <div className="fixed bottom-0 left-56 right-0 z-30">
        <div className="mx-6 mb-4 bg-[#1E3A5F] rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4A9FD4] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Month Summary</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Present: {monthPresent}
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Absent: {monthAbsent}
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              School Open: {monthOpenDays}
            </span>
          </div>
          <span className={`text-[11px] font-black text-white px-3 py-1 rounded-full ${statusColor}`}>
            STATUS: {statusLabel}
          </span>
        </div>
      </div>
    </ParentLayout>
  );
};

export default ParentAttendance;

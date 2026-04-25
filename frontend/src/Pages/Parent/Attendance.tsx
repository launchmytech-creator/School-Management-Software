import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import {
  useParentChildren,
  useParentAttendance,
  useParentHolidays,
  useSchoolOpenDays,
} from "../../hooks/queries";
import type { LinkedStudent } from "../../types/parent";
import { AttendanceCalendar } from "../../components/students/AttendanceCalendar";
import AttendanceSummary from "../../components/students/AttendanceSummary";
import AttendanceLegend from "../../components/students/AttendanceLegend";
import { getLocalDateString } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";

const EMPTY_CHILDREN: LinkedStudent[] = [];

const today = new Date();
const todayStr = getLocalDateString(today);

interface CalendarDay {
  date: Date;
  dateStr: string;
  status: "present" | "absent" | "holiday" | "sunday" | "none";
  isCurrentMonth: boolean;
  isToday?: boolean;
  holiday?: { description: string } | undefined;
}

/** Parent Attendance Page
 * 
 * Displays child's attendance calendar with year navigation.
 * Shows present/absent/holiday/sunday statuses with legend.
 * Uses SelectedChildContext for child selection.
 */
const ParentAttendance: React.FC = () => {
  const { user } = useAuth();
  const { selectedChildId } = useSelectedChild();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(
    Number(user?.id),
  );
  const children = childrenData || EMPTY_CHILDREN;

  const selected = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return (
        children.find((c) => c.id === selectedChildId) || children[0] || null
      );
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  const monthStart = getLocalDateString(new Date(viewYear, viewMonth, 1));
  const monthEnd = getLocalDateString(new Date(viewYear, viewMonth + 1, 0));

  const { data: records = [] } = useParentAttendance(
    selected?.id ?? 0,
    monthStart,
    monthEnd,
  );
  const { data: holidays = [] } = useParentHolidays(viewYear);
  const { data: monthOpenDays = 0 } = useSchoolOpenDays(
    viewYear,
    viewMonth + 1,
  );

  const recordMap = new Map(
    records.map((r) => [r.attendanceDate.slice(0, 10), r.status]),
  );

  const monthRecords = records.filter((r) => {
    const d = new Date(r.attendanceDate);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const monthPresent = monthRecords.filter(
    (r) => r.status === "present",
  ).length;
  const monthAbsent = monthRecords.filter((r) => r.status === "absent").length;
  const monthPct =
    monthOpenDays > 0 ? Math.round((monthPresent / monthOpenDays) * 100) : 0;

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = viewYear;
    const month = viewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: CalendarDay[] = [];

    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        dateStr: getLocalDateString(date),
        status: "none",
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);
      const status = recordMap.get(dateStr) as
        | "present"
        | "absent"
        | "late"
        | undefined;
      const holiday = holidays.find((h) => h.holidayDate === dateStr);
      const isSunday = date.getDay() === 0;

      let dayStatus: "present" | "absent" | "holiday" | "sunday" | "none" =
        "none";
      if (holiday) {
        dayStatus = "holiday";
      } else if (isSunday) {
        dayStatus = "sunday";
      } else if (status === "present") {
        dayStatus = "present";
      } else if (status === "absent" || status === "late") {
        dayStatus = "absent";
      }

      days.push({
        date,
        dateStr,
        status: dayStatus,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        holiday: holiday ? { description: holiday.description } : undefined,
      });
    }

    return days;
  }, [viewYear, viewMonth, recordMap, holidays]);

  const canGoPrev = useMemo(() => {
    const prevMonth = new Date(viewYear, viewMonth - 1, 1);
    return prevMonth >= new Date(new Date().getFullYear() - 1, 0, 1);
  }, [viewYear, viewMonth]);

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(viewYear, viewMonth + 1, 1);
    const todayDate = new Date();
    todayDate.setDate(1);
    todayDate.setHours(0, 0, 0, 0);
    return nextMonth <= todayDate;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (canGoPrev) {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (canGoNext) {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else setViewMonth((m) => m + 1);
    }
  };

  const monthYear = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Attendance Tracker"
        subtitle={
          selected
            ? `${selected.fullName} • ${selected.className || "N/A"}`
            : undefined
        }
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/parent/dashboard" },
            { label: "Attendance", active: true },
          ],
}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceCalendar
            calendarDays={calendarDays}
            loading={false}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            monthYear={monthYear}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        </div>
        <AttendanceSummary
          data={{
            totalDays: calendarDays.filter((d) => d.isCurrentMonth).length,
            holidayCount: calendarDays.filter(
              (d) => d.status === "holiday" && d.isCurrentMonth,
            ).length,
            sundayCount: calendarDays.filter(
              (d) => d.status === "sunday" && d.isCurrentMonth,
            ).length,
            workingDays: monthOpenDays,
            presentCount: monthPresent,
            absentCount: monthAbsent,
            percentage: monthPct,
          }}
          studentName={selected?.fullName ?? ""}
        />
      </div>

      <AttendanceLegend
        presentCount={monthPresent}
        absentCount={monthAbsent}
        holidayCount={
          calendarDays.filter((d) => d.status === "holiday" && d.isCurrentMonth)
            .length
        }
        sundayCount={
          calendarDays.filter((d) => d.status === "sunday" && d.isCurrentMonth)
            .length
        }
        showLate={true}
      />
    </div>
  );
};

export default ParentAttendance;

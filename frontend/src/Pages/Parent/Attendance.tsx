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
import { Calendar, type CalendarDay as CalendarDayType } from "../../components/common/Calendar";
import AttendanceSummary from "../../components/students/AttendanceSummary";
import AttendanceLegend from "../../components/students/AttendanceLegend";
import { getLocalDateString } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";

const EMPTY_CHILDREN: LinkedStudent[] = [];

const today = new Date();

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

  const calendarDays = useMemo<CalendarDayType[]>(() => {
    const year = viewYear;
    const month = viewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const days: CalendarDayType[] = [];

    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSunday: false,
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

      let attendanceStatus: "present" | "absent" | "leave" | "half_day" | null = null;
      if (holiday) {
        attendanceStatus = null;
      } else if (status === "present") {
        attendanceStatus = "present";
      } else if (status === "absent" || status === "late") {
        attendanceStatus = "absent";
      }

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === todayDate.getTime(),
        isSunday,
        holiday: holiday ? { description: holiday.description } : undefined,
        attendance: attendanceStatus,
      });
    }

    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSunday: false,
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <Calendar
            calendarDays={calendarDays}
            loading={false}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            monthYear={monthYear}
            onPrev={prevMonth}
            onNext={nextMonth}
            itemType="attendance"
            title="Attendance Calendar"
          />
        </div>
        <AttendanceSummary
          data={{
            totalDays: calendarDays.filter((d) => d.isCurrentMonth).length,
            holidayCount: calendarDays.filter(
              (d) => d.holiday && d.isCurrentMonth,
            ).length,
            sundayCount: calendarDays.filter(
              (d) => d.isSunday && d.isCurrentMonth,
            ).length,
            workingDays: monthOpenDays,
            presentCount: monthPresent,
            absentCount: monthAbsent,
            percentage: monthPct,
          }}
          studentName={selected?.fullName ?? ""}
          size="lg"
        />
      </div>

      <AttendanceLegend
        presentCount={monthPresent}
        absentCount={monthAbsent}
        holidayCount={
          calendarDays.filter((d) => d.holiday && d.isCurrentMonth)
            .length
        }
        sundayCount={
          calendarDays.filter((d) => d.isSunday && d.isCurrentMonth)
            .length
        }
        showLate={true}
      />
    </div>
  );
};

export default ParentAttendance;

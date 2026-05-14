import { useMemo, useCallback } from "react";
import { getLocalDateString } from "../lib/utils";

export interface BaseCalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
}

export interface CalendarNavigation {
  currentMonth: Date;
  monthYear: string;
  prevMonth: () => void;
  nextMonth: () => void;
}

export interface UseCalendarOptions<T extends BaseCalendarDay> {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  getDayProps: (date: Date, isCurrentMonth: boolean) => T;
}

export interface UseCalendarResult<T extends BaseCalendarDay> {
  calendarDays: T[];
  navigation: CalendarNavigation;
}

export function useCalendar<T extends BaseCalendarDay>(
  options: UseCalendarOptions<T>
): UseCalendarResult<T> {
  const { currentMonth, onMonthChange, getDayProps } = options;

  const calendarDays = useMemo<T[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: T[] = [];

    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(getDayProps(date, false));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(getDayProps(date, true));
    }

    return days;
  }, [currentMonth, getDayProps]);

  const monthYear = useMemo(
    () =>
      currentMonth.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  const prevMonth = useCallback(() => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth, onMonthChange]);

  const nextMonth = useCallback(() => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth, onMonthChange]);

  return {
    calendarDays,
    navigation: { currentMonth, monthYear, prevMonth, nextMonth },
  };
}

export type AttendanceDayStatus = "present" | "absent" | "holiday" | "sunday" | "none";

export interface AttendanceCalendarDay extends BaseCalendarDay {
  status: AttendanceDayStatus;
  holiday?: { holidayDate: string; description: string };
}

export interface HolidaysCalendarDay extends BaseCalendarDay {
  isToday: boolean;
  isSunday: boolean;
  holiday?: { holidayDate: string; description: string };
}

export function buildAttendanceDayProps(
  _date: Date,
  _isCurrentMonth: boolean,
  holidays: { holidayDate: string; description: string }[],
  attendanceRecords: { attendanceDate: string; status: string }[]
): Omit<AttendanceCalendarDay, "date" | "dateStr" | "isCurrentMonth"> {
  const dateStr = getLocalDateString(_date);
  const holiday = holidays.find((h) => h.holidayDate === dateStr);

  let status: AttendanceDayStatus = "none";
  if (holiday) {
    status = "holiday";
  } else if (_date.getDay() === 0) {
    status = "sunday";
  } else {
    const record = attendanceRecords.find(
      (r) => getLocalDateString(new Date(r.attendanceDate)) === dateStr
    );
    if (record?.status === "present") status = "present";
    else if (record?.status === "absent") status = "absent";
    else if (record?.status === "late") status = "absent";
  }

  return { status, holiday };
}

export function buildHolidaysDayProps(
  _date: Date,
  _isCurrentMonth: boolean,
  holidays: { holidayDate: string; description: string }[],
  today: Date
): Omit<HolidaysCalendarDay, "date" | "dateStr" | "isCurrentMonth"> {
  const dateStr = getLocalDateString(_date);
  const isToday =
    _date.getDate() === today.getDate() &&
    _date.getMonth() === today.getMonth() &&
    _date.getFullYear() === today.getFullYear();
  const isSunday = _date.getDay() === 0;
  const holiday = holidays.find((h) => h.holidayDate === dateStr);
  return { isToday, isSunday, holiday };
}

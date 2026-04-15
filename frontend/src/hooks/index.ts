// Re-export all query hooks
export * from './queries';

// Re-export all mutation hooks
export * from './mutations';

// Generic utility hooks
export { useDebounce } from './useDebounce';
export { usePagination } from './usePagination';
export { useModal } from './useModal';
export { useScrollableTabs } from './useScrollableTabs';
export type { UseScrollableTabsOptions } from './useScrollableTabs';
export { useCalendar } from './useCalendar';
export type { AttendanceCalendarDay, HolidaysCalendarDay } from './useCalendar';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { holidayService, type Holiday } from '../../services/holidayService';
import { academicYearService } from '../../services/academicYearService';
import { Plus, ChevronLeft, ChevronRight, Search, Download, Printer, Trash2 } from 'lucide-react';
import { formatDate, getLocalDateString } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  holiday?: Holiday;
}

const Holidays: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentYearId, setCurrentYearId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    holidayDate: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCurrentYear = useCallback(async () => {
    try {
      const year = await academicYearService.getCurrentYear();
      if (year) {
        setCurrentYearId(Number(year.id));
      }
    } catch {
      // Ignore - year might not exist
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const data = await holidayService.getHolidays();
      setHolidays(data);
    } catch {
      showNotification('Failed to fetch holidays', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchCurrentYear();
  }, [fetchCurrentYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleCreateHoliday = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.holidayDate) newErrors.holidayDate = 'Date is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!currentYearId) {
      showNotification('No academic year selected', 'error');
      return;
    }

    try {
      setCreating(true);
      await holidayService.createHoliday({
        holidayDate: formData.holidayDate,
        description: formData.description,
        academicYearId: currentYearId,
      });
      showNotification('Holiday created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ holidayDate: '', description: '' });
      setErrors({});
      fetchHolidays();
    } catch {
      showNotification('Failed to create holiday', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      await holidayService.deleteHoliday(id);
      showNotification('Holiday deleted successfully', 'success');
      fetchHolidays();
    } catch {
      showNotification('Failed to delete holiday', 'error');
    }
  };

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    const startPadding = firstDay.getDay();
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
      const holiday = holidays.find(h => h.holidayDate === dateStr);
      const isSunday = date.getDay() === 0;
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSunday,
        holiday,
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
  }, [currentMonth, holidays]);

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const totalDays = 365;
  const holidaysCount = holidays.length;
  const sundaysCount = Math.floor(totalDays / 7);
  const workingDays = totalDays - holidaysCount - sundaysCount;

  const upcomingHolidays = holidays
    .filter(h => new Date(h.holidayDate) >= new Date())
    .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime())
    .slice(0, 5);

  const filteredHolidays = holidays.filter(h =>
    h.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  };

  return (
    <AdminLayout title="Holidays">
      <div className="p-8 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Holiday Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-slate-900">Academic Calendar</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="font-bold text-slate-900 text-lg">{monthYear}</span>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div 
                    key={day} 
                    className={`text-center py-2 text-xs font-bold uppercase tracking-widest ${
                      index === 0 ? 'text-red-500' : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" message="Loading calendar..." />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const isHoliday = day.holiday && day.isCurrentMonth;
                    return (
                      <div
                        key={index}
                        className={`
                          h-20 p-2 rounded-lg transition-colors
                          ${!day.isCurrentMonth ? '' : ''}
                          ${isHoliday ? 'border-2 border-emerald-500 bg-emerald-100 shadow-sm' : ''}
                        ${day.isSunday && day.isCurrentMonth && !day.holiday ? 'border border-red-200 bg-red-50' : ''}
                        ${day.isCurrentMonth && !day.holiday && !day.isToday && !day.isSunday ? 'border border-slate-100 hover:bg-slate-50' : ''}
                        ${day.isToday && !day.holiday ? 'border-2 border-blue-500 bg-blue-50' : ''}
                        `}
                      >
                        <span className={`
                          text-sm font-bold
                          ${!day.isCurrentMonth ? 'text-slate-300' : ''}
                          ${isHoliday ? 'text-emerald-700' : ''}
                        ${day.isSunday && !day.holiday ? 'text-red-500' : ''}
                        ${day.isToday && !day.holiday ? 'text-blue-600' : ''}
                        ${day.isCurrentMonth && !day.holiday && !day.isToday && !day.isSunday ? 'text-slate-700' : ''}
                        `}>
                          {day.date.getDate()}
                        </span>
                        {isHoliday && (
                          <p className="text-[10px] mt-1 font-bold text-emerald-700 leading-tight truncate">
                            {day.holiday?.description}
                          </p>
                        )}
                        {day.isSunday && day.isCurrentMonth && !day.holiday && (
                          <p className="text-[10px] mt-1 font-bold text-red-500 uppercase">Sunday</p>
                        )}
                        {day.isToday && !day.holiday && (
                          <p className="text-[10px] mt-1 font-bold text-blue-600 uppercase">Today</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Working Days Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium text-slate-500">Total Days</span>
                  <span className="text-xl font-extrabold text-slate-900">{totalDays}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <span className="text-sm font-medium text-red-500">Holidays</span>
                  <span className="text-xl font-extrabold text-red-600">{holidaysCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <span className="text-sm font-medium text-orange-500">Sundays</span>
                  <span className="text-xl font-extrabold text-orange-600">{sundaysCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm font-medium text-blue-600">Working Days</span>
                  <span className="text-xl font-extrabold text-blue-600">{workingDays}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Upcoming</h3>
                <span className="text-xs font-bold text-blue-500 hover:underline cursor-pointer">View All</span>
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : upcomingHolidays.length > 0 ? (
                <div className="space-y-4 max-h-[280px] overflow-y-auto">
                  {upcomingHolidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {getMonthName(new Date(holiday.holidayDate))}
                        </span>
                        <span className="text-lg font-bold text-slate-900 leading-none">
                          {new Date(holiday.holidayDate).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{holiday.description}</p>
                        {holiday.academicYearName && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold uppercase tracking-tighter">
                            {holiday.academicYearName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No upcoming holidays
                </div>
              )}

              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full mt-6 bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" /> Add Holiday
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-xl text-slate-900">Full Holiday Schedule</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Search holidays..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Holiday Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.length > 0 ? (
                  filteredHolidays.map((holiday, index) => (
                    <tr
                      key={holiday.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatDate(holiday.holidayDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{holiday.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-tighter">
                          {holiday.academicYearName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      {searchQuery ? 'No holidays match your search' : 'No holidays found. Add your first holiday!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Showing {filteredHolidays.length} of {holidays.length} holidays
            </span>
          </div>
        </div>

        <BaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add Holiday"
          size="md"
        >
          <div className="p-6 space-y-4">
            <InputField
              label="Date"
              type="date"
              value={formData.holidayDate}
              onChange={(e) => {
                setFormData({ ...formData, holidayDate: e.target.value });
                if (errors.holidayDate) setErrors(prev => { const next = { ...prev }; delete next.holidayDate; return next; });
              }}
              error={errors.holidayDate}
              required
            />
            <InputField
              label="Description"
              placeholder="e.g., Independence Day"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors(prev => { const next = { ...prev }; delete next.description; return next; });
              }}
              error={errors.description}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateHoliday} loading={creating} className="flex-1">Add Holiday</Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default Holidays;

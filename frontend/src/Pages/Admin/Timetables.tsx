import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { timetableService, type TimetableEntry } from '../../services/timetableService';
import { useClasses, useSubjects, useTimetables } from '../../hooks/queries';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { Calendar, Plus, Clock, BookOpen, User } from 'lucide-react';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetables: React.FC = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const { allYears: academicYears } = useAcademicYear();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    classId: 0,
    academicYearId: 0,
    dayOfWeek: 1,
    periodNumber: 1,
    subjectId: 0,
    teacherId: 0,
    startTime: '09:00',
    endTime: '10:00',
    room: '',
  });

  const filters = {
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear ? parseInt(selectedYear) : undefined,
  };

  const { data: timetables = [], isLoading } = useTimetables(filters);

  const handleOpenCreate = () => {
    setFormData({
      classId: Number(selectedClass) || Number(classes[0]?.id) || 0,
      academicYearId: Number(selectedYear) || Number(academicYears[0]?.id) || 0,
      dayOfWeek: 1,
      periodNumber: 1,
      subjectId: 0,
      teacherId: 0,
      startTime: '09:00',
      endTime: '10:00',
      room: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await timetableService.createTimetable(formData);
      showNotification('Timetable entry created successfully', 'success');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    } catch {
      showNotification('Failed to create timetable entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const groupedTimetables = timetables.reduce((acc, entry) => {
    const day = entry.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<number, TimetableEntry[]>);

  return (
    <div className="space-y-6 pb-12">
        <PageHeader 
          title="Timetables"
          subtitle="Manage class schedules and periods"
          breadcrumb={{
            links: [
              { label: "Schedule", href: "/admin/timetables" },
              { label: "Timetables", active: true }
            ]
          }}
          actions={[
            {
              label: "Add Period",
              icon: Plus,
              onClick: handleOpenCreate
            }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
                <p className="text-sm text-slate-500">Classes</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{timetables.length}</p>
                <p className="text-sm text-emerald-600">Schedule Entries</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{Object.keys(groupedTimetables).length}</p>
                <p className="text-sm text-purple-600">Days Scheduled</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedClass || !selectedYear ? (
          <EmptyState
            icon={Calendar}
            title="Select filters to view timetable"
            description="Choose a class and academic year to view the schedule"
          />
        ) : isLoading ? (
          <SkeletonTable columns={5} rows={5} />
        ) : Object.keys(groupedTimetables).length > 0 ? (
          <div className="space-y-6">
            {DAYS.map((day, index) => {
              const dayEntries = groupedTimetables[index] || [];
              if (dayEntries.length === 0) return null;
              
              return (
                <div key={day} className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                      {index === 0 ? 'S' : index === 6 ? 'S' : ''}
                    </span>
                    {day}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayEntries.sort((a, b) => a.periodNumber - b.periodNumber).map(entry => (
                      <div key={entry.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-blue-600">Period {entry.periodNumber}</span>
                          <span className="text-xs text-slate-500">{entry.startTime} - {entry.endTime}</span>
                        </div>
                        <p className="font-semibold text-slate-900">{entry.subjectName || 'Free Period'}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                          {entry.teacherName && <User className="w-3 h-3" />}
                          <span>{entry.teacherName || 'No teacher'}</span>
                          {entry.room && <span>• Room {entry.room}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No timetable entries"
            description="Add periods to create the class schedule"
            action={{
              label: "Add Period",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add Period"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Day of Week"
                type="number"
                min={0}
                max={6}
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
              />
              <InputField
                label="Period Number"
                type="number"
                min={1}
                value={formData.periodNumber}
                onChange={(e) => setFormData({ ...formData, periodNumber: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
              <InputField
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <select
                value={formData.subjectId || ''}
                onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <InputField
              label="Room (Optional)"
              placeholder="e.g., Room 101"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">Add Period</Button>
            </div>
          </div>
        </BaseModal>
    </div>
  );
};

export default Timetables;

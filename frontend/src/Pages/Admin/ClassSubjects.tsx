import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { subjectService, type ClassSubject, type AssignSubjectToClassDto, type Subject } from '../../services/subjectService';
import { classService } from '../../services/classService';
import { academicYearService } from '../../services/academicYearService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { BookMarked, Plus, Trash2, Link, Unlink } from 'lucide-react';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import { SkeletonTable } from '../../components/common/Skeleton';

const ClassSubjects: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [formData, setFormData] = useState<AssignSubjectToClassDto>({
    classId: 0,
    subjectId: 0,
    academicYearId: 0,
  });

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      showNotification('Failed to fetch subjects', 'error');
    }
  }, [showNotification]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const data = await academicYearService.getAllYears();
      setAcademicYears(data);
    } catch {
      showNotification('Failed to fetch academic years', 'error');
    }
  }, [showNotification]);

  const fetchClassSubjects = useCallback(async (classId: number, yearId?: number) => {
    try {
      setLoading(true);
      const data = await subjectService.getSubjectsByClass(classId);
      
      if (yearId) {
        const filteredData = data.filter(cs => cs.academicYearId === yearId);
        setClassSubjects(filteredData);
      } else {
        setClassSubjects(data);
      }
    } catch {
      showNotification('Failed to fetch class subjects', 'error');
      setClassSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchAcademicYears();
  }, [fetchClasses, fetchSubjects, fetchAcademicYears]);

  useEffect(() => {
    if (selectedClass) {
      const yearId = selectedYear ? parseInt(selectedYear) : undefined;
      fetchClassSubjects(parseInt(selectedClass), yearId);
    } else {
      setClassSubjects([]);
      setLoading(false);
    }
  }, [selectedClass, selectedYear, fetchClassSubjects]);

  const getSubjectCode = (subjectId: number): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.code || '';
  };

  const filteredSubjects = classSubjects.filter(cs =>
    cs.subjectName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
    getSubjectCode(cs.subjectId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignedSubjectIds = classSubjects.map(cs => cs.subjectId);

  const handleOpenCreate = () => {
    const defaultClassId = selectedClass ? parseInt(selectedClass) : (classes[0]?.id || 0);
    const currentYear = academicYears.find(y => y.isCurrent);
    const defaultYearId = selectedYear ? parseInt(selectedYear) : (currentYear?.id || academicYears[0]?.id || 0);
    
    setFormData({
      classId: Number(defaultClassId),
      subjectId: 0,
      academicYearId: Number(defaultYearId),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.classId || !formData.subjectId || !formData.academicYearId) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      await subjectService.assignSubjectToClass(formData);
      showNotification('Subject assigned to class successfully', 'success');
      setShowModal(false);
      if (selectedClass) {
        const yearId = selectedYear ? parseInt(selectedYear) : undefined;
        fetchClassSubjects(parseInt(selectedClass), yearId);
      }
      fetchSubjects();
    } catch {
      showNotification('Failed to assign subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this subject from the class?')) return;
    
    try {
      setDeleting(id);
      await subjectService.removeSubjectFromClass(id);
      showNotification('Subject removed from class successfully', 'success');
      if (selectedClass) {
        const yearId = selectedYear ? parseInt(selectedYear) : undefined;
        fetchClassSubjects(parseInt(selectedClass), yearId);
      }
      fetchSubjects();
    } catch {
      showNotification('Failed to remove subject', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
  const currentYearName = academicYears.find(y => y.id === selectedYear)?.name || '';

  return (
    <AdminLayout title="Class Subjects">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Class Subjects"
          subtitle="Assign subjects to classes for each academic year"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Class Subjects", active: true }
            ]
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
                <p className="text-sm text-slate-500">Total Classes</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <BookMarked className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{subjects.length}</p>
                <p className="text-sm text-emerald-600">Total Subjects</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <BookMarked className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{assignedSubjectIds.length}</p>
                <p className="text-sm text-purple-600">Assigned</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Link className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{subjects.length - assignedSubjectIds.length}</p>
                <p className="text-sm text-amber-600">Unassigned</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Unlink className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - Section {cls.section || 'A'}
                </option>
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
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <FilterBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onReset={() => setSearchTerm('')}
            searchPlaceholder="Search subjects..."
          >
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Assign Subject
            </Button>
          </FilterBar>
        )}

        {!selectedClass ? (
          <EmptyState
            icon={BookMarked}
            title="Select a class"
            description="Choose a class from the dropdown to view and manage assigned subjects"
          />
        ) : loading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : filteredSubjects.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((cs) => (
                  <tr key={cs.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <BookMarked className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cs.subjectName}</p>
                          <p className="text-xs text-slate-500">{selectedClassName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        {getSubjectCode(cs.subjectId) || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                        {cs.academicYearName || currentYearName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(cs.id)}
                        disabled={deleting === cs.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Unlink}
            title="No subjects assigned"
            description={`No subjects have been assigned to ${selectedClassName} yet. Assign subjects to get started.`}
            action={{
              label: "Assign Subject",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Assign Subject to Class"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
              <select
                value={formData.classId || ''}
                onChange={(e) => setFormData({ ...formData, classId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - Section {cls.section || 'A'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
              <select
                value={formData.academicYearId || ''}
                onChange={(e) => setFormData({ ...formData, academicYearId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <select
                value={formData.subjectId || ''}
                onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects
                  .filter(s => !assignedSubjectIds.includes(s.id))
                  .map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
              </select>
              {assignedSubjectIds.length === subjects.length && subjects.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">All subjects have been assigned to this class</p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                Assign Subject
              </Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default ClassSubjects;

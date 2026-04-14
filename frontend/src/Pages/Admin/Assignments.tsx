import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useAssignments, useCreateAssignment, useDeleteAssignment } from '../../hooks/queries';
import { useClasses, useSubjects } from '../../hooks/queries';
import { useAcademicYears } from '../../hooks/queries';
import { FileText, Plus, Trash2, Clock, CheckCircle, Users } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAssignmentSchema, type CreateAssignmentFormData } from '../../schemas/academic.schema';

const Assignments: React.FC = () => {
  const { showNotification } = useNotification();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
  });

  const filters = {
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear ? parseInt(selectedYear) : undefined,
  };

  const { data: assignments = [], isLoading } = useAssignments(filters);
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: academicYears = [] } = useAcademicYears();

  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.dueDate && new Date(a.dueDate) > new Date()).length,
    submitted: assignments.reduce((sum, a) => sum + a.submissionCount, 0),
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'bg-blue-100 text-blue-700';
      case 'classwork': return 'bg-emerald-100 text-emerald-700';
      case 'project': return 'bg-purple-100 text-purple-700';
      case 'quiz': return 'bg-amber-100 text-amber-700';
      case 'test': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleOpenCreate = () => {
    reset({
      classId: Number(selectedClass) || Number(classes[0]?.id) || 0,
      subjectId: subjects[0]?.id || 0,
      academicYearId: Number(selectedYear) || Number(academicYears[0]?.id) || 0,
      title: '',
      description: '',
      dueDate: '',
      maxMarks: 100,
      assignmentType: 'homework',
    });
    setShowModal(true);
  };

  const onSubmit = (data: CreateAssignmentFormData) => {
    createAssignment.mutate(data as any, {
      onSuccess: () => {
        showNotification('Assignment created successfully', 'success');
        setShowModal(false);
      },
      onError: () => {
        showNotification('Failed to create assignment', 'error');
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    deleteAssignment.mutate(id, {
      onSuccess: () => {
        showNotification('Assignment deleted successfully', 'success');
      },
      onError: () => {
        showNotification('Failed to delete assignment', 'error');
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
        <PageHeader 
          title="Assignments"
          subtitle="Create and manage student assignments"
          breadcrumb={{
            links: [
              { label: "Schedule", href: "/admin/announcements" },
              { label: "Assignments", active: true }
            ]
          }}
          actions={[
            {
              label: "Create Assignment",
              icon: Plus,
              onClick: handleOpenCreate
            }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Assignments</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.submitted}</p>
                <p className="text-sm text-emerald-600">Submissions</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
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
              <option value="">All Classes</option>
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
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => setSearchTerm('')}
          searchPlaceholder="Search assignments..."
        />

        {isLoading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : filteredAssignments.length > 0 ? (
          <div className="space-y-4">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(assignment.assignmentType)}`}>
                          {assignment.assignmentType}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-3">{assignment.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{assignment.className}</span>
                        <span>•</span>
                        <span>{assignment.subjectName}</span>
                        <span>•</span>
                        <span>By: {assignment.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {assignment.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                        )}
                        {assignment.maxMarks && (
                          <span>Max Marks: {assignment.maxMarks}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {assignment.submissionCount} submissions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      disabled={deleteAssignment.isPending}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No assignments found"
            description="Create your first assignment to get started"
            action={{
              label: "Create Assignment",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Assignment"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <InputField
              label="Title"
              placeholder="Assignment title"
              error={errors.title?.message}
              {...register('title')}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                placeholder="Assignment description"
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...register('description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('classId', { valueAsNumber: true })}
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('subjectId', { valueAsNumber: true })}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Due Date"
                type="date"
                error={errors.dueDate?.message}
                {...register('dueDate')}
              />
              <InputField
                label="Max Marks"
                type="number"
                error={errors.maxMarks?.message}
                {...register('maxMarks', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('assignmentType')}
              >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="test">Test</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={createAssignment.isPending} className="flex-1">Create</Button>
            </div>
          </form>
        </BaseModal>
    </div>
  );
};

export default Assignments;

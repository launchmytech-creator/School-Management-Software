import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { examService, type Exam } from '../../services/examService';
import { subjectService, type ClassSubject } from '../../services/subjectService';
import { useExams, useCreateExam, useUpdateExam, useDeleteExam } from '../../hooks/queries';
import { useClasses } from '../../hooks/queries';
import { Plus, Calendar, BookOpen, Trash2, Edit2, X, AlertCircle, GraduationCap } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EXAM_TYPE_OPTIONS } from '../../lib/subject-utils';

interface SubjectFormItem {
  subjectId: number;
  subjectName: string;
  maxMarks: string;
  examDate: string;
}

interface ExamsListProps {
  layout: 'admin' | 'accountant';
}

const ExamsList: React.FC<ExamsListProps> = ({ layout }) => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();
  
  const isAdmin = layout === 'admin';
  const basePath = isAdmin ? '/admin' : '/accountant';
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectFormItem[]>([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, examId: null as number | null });
  
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHasResults, setEditHasResults] = useState(false);
  const [checkingResults, setCheckingResults] = useState(false);

  const createExamSchema = z.object({
    name: z.string().min(1, 'Exam name is required'),
    classId: z.string().min(1, 'Class is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    examType: z.string().optional(),
    weightage: z.string().optional(),
  });

  const editExamSchema = z.object({
    name: z.string().min(1, 'Exam name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    examType: z.string().optional(),
    weightage: z.string().optional(),
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<z.infer<typeof createExamSchema>>({
    resolver: zodResolver(createExamSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<z.infer<typeof editExamSchema>>({
    resolver: zodResolver(editExamSchema),
  });

  const { data: exams = [], isLoading } = useExams({ classId: selectedClass ? parseInt(selectedClass) : undefined });
  const { data: classes = [] } = useClasses(selectedYear?.id);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const handleClassChange = async (classId: string) => {
    setSelectedSubjects([]);
    if (classId) {
      try {
        const subjects = await subjectService.getSubjectsByClass(parseInt(classId));
        setClassSubjects(subjects);
      } catch {
        setClassSubjects([]);
      }
    } else {
      setClassSubjects([]);
    }
  };

  const handleAddSubject = (subjectId: number) => {
    const subject = classSubjects.find(s => s.subjectId === subjectId);
    if (!subject) return;
    
    if (selectedSubjects.some(s => s.subjectId === subjectId)) {
      showNotification('Subject already added', 'error');
      return;
    }

    setSelectedSubjects([
      ...selectedSubjects,
      {
        subjectId,
        subjectName: subject.subjectName,
        maxMarks: '100',
        examDate: '',
      },
    ]);
  };

  const handleRemoveSubject = (subjectId: number) => {
    setSelectedSubjects(selectedSubjects.filter(s => s.subjectId !== subjectId));
  };

  const handleSubjectChange = (subjectId: number, field: 'maxMarks' | 'examDate', value: string) => {
    setSelectedSubjects(
      selectedSubjects.map(s =>
        s.subjectId === subjectId ? { ...s, [field]: value } : s
      )
    );
  };

  const resetForm = () => {
    resetCreate();
    setSelectedSubjects([]);
    setClassSubjects([]);
  };

  const onCreateExam = (data: z.infer<typeof createExamSchema>) => {
    if (!selectedYear?.id) {
      showNotification('Please select an academic year first', 'error');
      return;
    }

    if (selectedSubjects.length === 0) {
      showNotification('Add at least one subject', 'error');
      return;
    }

    const examData = {
      name: data.name,
      classId: parseInt(data.classId),
      academicYearId: parseInt(selectedYear.id),
      examType: data.examType || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      weightage: data.weightage ? parseInt(data.weightage) : undefined,
      subjects: selectedSubjects.map(s => ({
        subjectId: s.subjectId,
        maxMarks: parseFloat(s.maxMarks) || 100,
        examDate: s.examDate || undefined,
      })),
    };

    createExam.mutate(examData, {
      onSuccess: () => {
        showNotification('Exam created successfully', 'success');
        setShowCreateModal(false);
        resetForm();
      },
      onError: (error: Error) => {
        showNotification(error.message || 'Failed to create exam', 'error');
      },
    });
  };

  const handleDeleteExam = async () => {
    if (!deleteDialog.examId) return;
    
    deleteExam.mutate(deleteDialog.examId, {
      onSuccess: () => {
        showNotification('Exam deleted successfully', 'success');
      },
      onError: () => {
        showNotification('Failed to delete exam', 'error');
      },
      onSettled: () => {
        setDeleteDialog({ isOpen: false, examId: null });
      },
    });
  };

  const handleEditExam = async (exam: Exam) => {
    try {
      setCheckingResults(true);
      const results = await examService.getResults({ examId: exam.id });
      const hasResults = results.length > 0;
      setEditHasResults(hasResults);
      
      setEditingExam(exam);
      resetEdit({
        name: exam.name,
        examType: exam.examType || '',
        startDate: exam.startDate,
        endDate: exam.endDate,
        weightage: exam.weightage?.toString() || '',
      });
      setShowEditModal(true);
    } catch {
      showNotification('Failed to load exam details', 'error');
    } finally {
      setCheckingResults(false);
    }
  };

  const onUpdateExam = (data: z.infer<typeof editExamSchema>) => {
    if (!editingExam) return;

    updateExam.mutate(
      {
        id: editingExam.id,
        data: {
          name: data.name,
          examType: data.examType || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          weightage: data.weightage ? parseInt(data.weightage) : undefined,
        },
      },
      {
        onSuccess: () => {
          showNotification('Exam updated successfully', 'success');
          setShowEditModal(false);
          setEditingExam(null);
        },
        onError: (error: Error) => {
          showNotification(error.message || 'Failed to update exam', 'error');
        },
      }
    );
  };

  const availableSubjects = classSubjects.filter(
    cs => !selectedSubjects.some(s => s.subjectId === cs.subjectId)
  );

  const renderContent = () => (
    <>
      {isAdmin && (
        <PageHeader 
          title="Examinations"
          subtitle="Manage exams and view results"
          breadcrumb={{
            links: [
              { label: "Exams", href: `${basePath}/exams` },
              { label: "Examinations", active: true }
            ]
          }}
          actions={[
            {
              label: "Create Exam",
              icon: Plus,
              onClick: () => setShowCreateModal(true)
            }
          ]}
        />
      )}

      <FilterBar 
        searchTerm=""
        onSearchChange={() => {}}
        onReset={() => setSelectedClass('')}
      >
        {!isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        )}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
          ))}
        </select>
      </FilterBar>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading exams..." />
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditExam(exam)}
                    disabled={checkingResults}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ isOpen: true, examId: exam.id })}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{exam.name}</h3>
              <p className="text-sm text-slate-500 mb-3">
                {exam.className} - Section {exam.classSection || 'A'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {exam.examType && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {exam.examType}
                  </span>
                )}
                {exam.weightage && (
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    Weightage: {exam.weightage}%
                  </span>
                )}
                {exam.subjects && exam.subjects.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {exam.subjects.length} Subjects
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDate(exam.startDate)} - {formatDate(exam.endDate)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => navigate(`${basePath}/marks-entry?examId=${exam.id}&classId=${exam.classId}`)}
                  className="flex-1 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Enter Marks
                </button>
                <button
                  onClick={() => navigate(`${basePath}/exam-results?examId=${exam.id}&classId=${exam.classId}`)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Exams Found</h3>
          <p className="text-slate-500 mb-6">Create your first exam to get started</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </div>
      )}

      <BaseModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Exam"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateExam)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField
                label="Exam Name"
                placeholder="e.g., Half Yearly Examination"
                error={createErrors.name?.message}
                {...registerCreate('name')}
              />
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-center px-1">
                <label className={`block text-xs font-semibold ${createErrors.classId ? 'text-red-500' : 'text-slate-700'}`}>Class</label>
                {createErrors.classId && <span className="text-[10px] font-bold text-red-500">{createErrors.classId.message}</span>}
              </div>
              <select
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${createErrors.classId ? 'border-red-500 bg-red-50/30 focus:ring-red-500/10' : 'border-slate-200 focus:ring-blue-500'}`}
                {...registerCreate('classId')}
                onChange={(e) => {
                  registerCreate('classId').onChange(e);
                  handleClassChange(e.target.value);
                }}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
              <select
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...registerCreate('examType')}
              >
                <option value="">Select Type (Optional)</option>
                {EXAM_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <InputField
                label="Weightage (%)"
                type="number"
                placeholder="e.g., 50"
                {...registerCreate('weightage')}
              />
            </div>

            <div>
              <InputField
                label="Start Date"
                type="date"
                error={createErrors.startDate?.message}
                {...registerCreate('startDate')}
              />
            </div>

            <div>
              <InputField
                label="End Date"
                type="date"
                error={createErrors.endDate?.message}
                {...registerCreate('endDate')}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-bold text-slate-700">
                  Subjects <span className="text-red-500">*</span>
                </label>
              </div>
              <span className="text-xs text-slate-500">
                {selectedSubjects.length} subject(s) added
              </span>
            </div>

            <div className="col-span-2">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddSubject(parseInt(e.target.value));
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Add a subject...</option>
                {availableSubjects.map(cs => (
                  <option key={cs.subjectId} value={cs.subjectId}>
                    {cs.subjectName}
                  </option>
                ))}
              </select>
            </div>

            {availableSubjects.length === 0 && selectedSubjects.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mt-4">
                <AlertCircle className="w-4 h-4" />
                No subjects assigned to this class. Please assign subjects first.
              </div>
            )}

            {selectedSubjects.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Selected Subjects
                </div>
                {selectedSubjects.map((subject) => (
                  <div
                    key={subject.subjectId}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700 text-sm">{subject.subjectName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <input
                          type="number"
                          placeholder="Max"
                          value={subject.maxMarks}
                          onChange={(e) => handleSubjectChange(subject.subjectId, 'maxMarks', e.target.value)}
                          className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                        <p className="text-[10px] text-slate-400 text-center mt-0.5">Max Marks</p>
                      </div>
                      <div>
                        <input
                          type="date"
                          value={subject.examDate}
                          onChange={(e) => handleSubjectChange(subject.subjectId, 'examDate', e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 text-center mt-0.5">Exam Date</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject.subjectId)}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createExam.isPending}
              className="flex-1"
            >
              Create Exam
            </Button>
          </div>
        </form>
      </BaseModal>

      {/* Edit Exam Modal */}
      <BaseModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingExam(null); }}
        title="Edit Exam"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onUpdateExam)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {editHasResults && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>This exam already has submitted results. You can only edit basic details.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField
                label="Exam Name"
                placeholder="e.g., Half Yearly Examination"
                error={editErrors.name?.message}
                {...registerEdit('name')}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
              <select
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...registerEdit('examType')}
              >
                <option value="">Select Type (Optional)</option>
                {EXAM_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <InputField
                label="Weightage (%)"
                type="number"
                placeholder="e.g., 50"
                {...registerEdit('weightage')}
              />
            </div>

            <div>
              <InputField
                label="Start Date"
                type="date"
                error={editErrors.startDate?.message}
                {...registerEdit('startDate')}
              />
            </div>

            <div>
              <InputField
                label="End Date"
                type="date"
                error={editErrors.endDate?.message}
                {...registerEdit('endDate')}
              />
            </div>

            {editingExam && (
              <div className="col-span-2 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span>Class and subjects cannot be changed after exam creation.</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => { setShowEditModal(false); setEditingExam(null); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateExam.isPending}
              className="flex-1"
            >
              Update Exam
            </Button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, examId: null })}
        onConfirm={handleDeleteExam}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );

  return <div className="space-y-6">{renderContent()}</div>;
};

export default ExamsList;

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { useNotification } from '../../context/NotificationContext';
import { examService, type Exam } from '../../services/examService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { Plus, Calendar, BookOpen, Trash2, Edit2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const Exams: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await examService.getExams(selectedClass ? parseInt(selectedClass) : undefined);
      setExams(data);
    } catch {
      showNotification('Failed to fetch exams', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleCreateExam = async () => {
    if (!formData.name || !formData.classId || !formData.startDate || !formData.endDate) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      setCreating(true);
      await examService.createExam({
        name: formData.name,
        classId: parseInt(formData.classId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
      });
      showNotification('Exam created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', classId: '', startDate: '', endDate: '', description: '' });
      fetchExams();
    } catch {
      showNotification('Failed to create exam', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      await examService.deleteExam(id);
      showNotification('Exam deleted successfully', 'success');
      fetchExams();
    } catch {
      showNotification('Failed to delete exam', 'error');
    }
  };

  return (
    <AdminLayout title="Examinations">
      <div className="space-y-8 pb-12">
        <PageHeader 
          title="Examinations"
          subtitle="Manage exams and view results"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
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

        <FilterBar 
          searchTerm=""
          onSearchChange={() => {}}
          onReset={() => setSelectedClass('')}
        >
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

        {loading ? (
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
                      onClick={() => showNotification('Edit coming soon', 'info')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{exam.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{exam.className}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDate(exam.startDate)} - {formatDate(exam.endDate)}</span>
                  </div>
                  {exam.description && (
                    <p className="text-slate-500 line-clamp-2">{exam.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <a
                    href={`/admin/exams/${exam.id}/marks`}
                    className="flex-1 py-2 bg-blue-500 text-white text-center text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Enter Marks
                  </a>
                  <a
                    href={`/admin/exams/${exam.id}/results`}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-center text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    View Results
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Exams Found</h3>
            <p className="text-slate-500 mb-6">Create your first exam to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </div>
        )}

        {/* Create Exam Modal */}
        <BaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Exam"
          size="md"
        >
          <div className="p-6 space-y-4">
            <InputField
              label="Exam Name"
              placeholder="e.g., Terminal Examination"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <InputField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateExam}
                loading={creating}
                className="flex-1"
              >
                Create Exam
              </Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default Exams;

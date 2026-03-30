import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { subjectService, type Subject, type Chapter } from '../../services/subjectService';
import { BaseModal } from '../../components/common/BaseModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Plus, BookOpen, Trash2, ChevronRight, List } from 'lucide-react';

const Subjects: React.FC = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Record<number, Chapter[]>>({});
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [showChapterListModal, setShowChapterListModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: ''});
  const [chapterForm, setChapterForm] = useState({ name: '', sequenceNumber: '' });
  const [subjectErrors, setSubjectErrors] = useState<Record<string, string>>({});
  const [chapterErrors, setChapterErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    itemId: null as number | null,
    loading: false,
  });

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      showNotification('Failed to fetch subjects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchChapters = useCallback(async (subjectId: number) => {
    try {
      const data = await subjectService.getChaptersBySubject(subjectId);
      setChapters(prev => ({ ...prev, [subjectId]: data }));
    } catch {
      showNotification('Failed to fetch chapters', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubject = async () => {
    const newErrors: Record<string, string> = {};
    if (!subjectForm.name) newErrors.name = 'Subject name is required';
    if (!subjectForm.code) newErrors.code = 'Subject code is required';
    if (Object.keys(newErrors).length > 0) {
      setSubjectErrors(newErrors);
      return;
    }

    try {
      setCreating(true);
      await subjectService.createSubject(subjectForm);
      showNotification('Subject created successfully', 'success');
      setShowCreateSubjectModal(false);
      setSubjectForm({ name: '', code: ''});
      setSubjectErrors({});
      fetchSubjects();
    } catch {
      showNotification('Failed to create subject', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSubjectFieldChange = (field: string, value: string) => {
    setSubjectForm(prev => ({ ...prev, [field]: value }));
    if (subjectErrors[field]) {
      setSubjectErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCreateChapter = async () => {
    const newErrors: Record<string, string> = {};
    if (!chapterForm.name) newErrors.name = 'Chapter name is required';
    if (!selectedSubject) newErrors.subject = 'No subject selected';
    if (Object.keys(newErrors).length > 0) {
      setChapterErrors(newErrors);
      return;
    }

    try {
      setCreating(true);
      const subjectId = selectedSubject!;
      await subjectService.createChapter({
        subjectId,
        name: chapterForm.name,
        sequenceNumber: chapterForm.sequenceNumber ? parseInt(chapterForm.sequenceNumber) : undefined,
      });
      showNotification('Chapter created successfully', 'success');
      setShowCreateChapterModal(false);
      setChapterForm({ name: '', sequenceNumber: '' });
      setChapterErrors({});
      fetchChapters(subjectId);
    } catch {
      showNotification('Failed to create chapter', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleChapterFieldChange = (field: string, value: string) => {
    setChapterForm(prev => ({ ...prev, [field]: value }));
    if (chapterErrors[field]) {
      setChapterErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDeleteSubject = (id: number) => {
    setDeleteDialog({ isOpen: true, itemId: id, loading: false });
  };

  const confirmDeleteSubject = async () => {
    if (!deleteDialog.itemId) return;
    try {
      setDeleteDialog({ ...deleteDialog, loading: true });
      await subjectService.deleteSubject(deleteDialog.itemId);
      showNotification('Subject deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, itemId: null, loading: false });
      fetchSubjects();
    } catch {
      showNotification('Failed to delete subject', 'error');
      setDeleteDialog({ ...deleteDialog, loading: false });
    }
  };

  const openChapterModal = (subjectId: number) => {
    setSelectedSubject(subjectId);
    if (!chapters[subjectId]) {
      fetchChapters(subjectId);
    }
    setShowChapterListModal(true);
  };

  return (
    <AdminLayout title="Subjects">
      <div className="space-y-8 pb-12">
        <PageHeader 
          title="Subjects"
          subtitle="Manage subjects and chapters"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Subjects", active: true }
            ]
          }}
          actions={[
            {
              label: "Add Subject",
              icon: Plus,
              onClick: () => setShowCreateSubjectModal(true)
            }
          ]}
        />

        {loading ? (
          <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading subjects..." />
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelectedSubject(subject.id); setChapterErrors({}); setChapterForm({ name: '', sequenceNumber: '' }); setShowCreateChapterModal(true); }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Add Chapter"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => openChapterModal(subject.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="View Chapters"
                    >
                      <List className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 mb-1">{subject.name}</h3>
                <p className="text-sm text-slate-500 mb-3">Code: {subject.code}</p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/admin/subjects/${subject.id}/chapters`)}
                    className="flex-1 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Manage Chapters
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Subjects Found</h3>
            <p className="text-slate-500 mb-6">Create your first subject to get started</p>
            <Button onClick={() => setShowCreateSubjectModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
        )}

        {/* Create Subject Modal */}
        <BaseModal
          isOpen={showCreateSubjectModal}
          onClose={() => setShowCreateSubjectModal(false)}
          title="Add New Subject"
          size="md"
        >
          <div className="p-6 space-y-4">
            <InputField
              label="Subject Name"
              placeholder="e.g., Mathematics"
              value={subjectForm.name}
              onChange={(e) => handleSubjectFieldChange('name', e.target.value)}
              error={subjectErrors.name}
            />
            <InputField
              label="Subject Code"
              placeholder="e.g., MATH"
              value={subjectForm.code}
              onChange={(e) => handleSubjectFieldChange('code', e.target.value)}
              error={subjectErrors.code}
            />
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateSubjectModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateSubject} loading={creating} className="flex-1">Create Subject</Button>
            </div>
          </div>
        </BaseModal>

        {/* Create Chapter Modal */}
        <BaseModal
          isOpen={showCreateChapterModal}
          onClose={() => setShowCreateChapterModal(false)}
          title="Add New Chapter"
          size="md"
        >
          <div className="p-6 space-y-4">
            <InputField
              label="Chapter Name"
              placeholder="e.g., Chapter 1 - Introduction"
              value={chapterForm.name}
              onChange={(e) => handleChapterFieldChange('name', e.target.value)}
              error={chapterErrors.name}
            />
            <InputField
              label="Sequence Number"
              type="number"
              placeholder="e.g., 1"
              value={chapterForm.sequenceNumber}
              onChange={(e) => handleChapterFieldChange('sequenceNumber', e.target.value)}
            />
            {chapterErrors.subject && (
              <p className="text-red-500 text-xs">{chapterErrors.subject}</p>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateChapterModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateChapter} loading={creating} className="flex-1">Add Chapter</Button>
            </div>
          </div>
        </BaseModal>

        {/* Chapter List Modal */}
        <BaseModal
          isOpen={showChapterListModal}
          onClose={() => setShowChapterListModal(false)}
          title="Chapters"
          size="lg"
        >
          <div className="p-6">
            {selectedSubject && chapters[selectedSubject] ? (
              chapters[selectedSubject].length > 0 ? (
                <div className="space-y-2">
                  {chapters[selectedSubject].map((chapter) => (
                    <div key={chapter.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                          {chapter.sequenceNumber}
                        </span>
                        <span className="font-medium text-slate-700">{chapter.name}</span>
                      </div>
                      <button
                        onClick={() => showNotification('Delete coming soon', 'info')}
                        className="p-2 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No chapters yet. Add your first chapter!
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}
          </div>
        </BaseModal>

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, itemId: null, loading: false })}
          onConfirm={confirmDeleteSubject}
          title="Delete Subject"
          message="Are you sure you want to delete this subject? This will also delete all chapters under this subject."
          confirmText="Delete"
          variant="danger"
          loading={deleteDialog.loading}
        />
      </div>
    </AdminLayout>
  );
};

export default Subjects;

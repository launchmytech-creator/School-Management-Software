import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { subjectService, type Chapter, type CreateChapterDto } from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { BookOpen, Plus, Edit2, Trash2, List } from 'lucide-react';
import { BaseModal } from '../../components/common/BaseModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const Chapters: React.FC = () => {
  const { showNotification } = useNotification();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectId || '');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; chapterId: number | null }>({ isOpen: false, chapterId: null });
  const [formData, setFormData] = useState<CreateChapterDto>({
    subjectId: 0,
    name: '',
    sequenceNumber: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      showNotification('Failed to fetch subjects', 'error');
    }
  }, [showNotification]);

  const fetchChapters = useCallback(async (subjectId: number) => {
    try {
      setLoading(true);
      const data = await subjectService.getChaptersBySubject(subjectId);
      setChapters(data);
    } catch {
      showNotification('Failed to fetch chapters', 'error');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (subjectId && !selectedSubject) {
      setSelectedSubject(subjectId);
    }
  }, [subjectId]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(parseInt(selectedSubject));
    } else {
      setChapters([]);
      setLoading(false);
    }
  }, [selectedSubject, fetchChapters]);

  const filteredChapters = chapters.filter(ch =>
    ch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingChapter(null);
    setFormData({
      subjectId: parseInt(selectedSubject || subjectId || '0'),
      name: '',
      sequenceNumber: chapters.length + 1,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      subjectId: chapter.subjectId,
      name: chapter.name,
      sequenceNumber: chapter.sequenceNumber,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Chapter name is required';
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      if (editingChapter) {
        await subjectService.updateChapter(editingChapter.id, {
          name: formData.name,
          sequenceNumber: formData.sequenceNumber,
        });
        showNotification('Chapter updated successfully', 'success');
      } else {
        await subjectService.createChapter(formData);
        showNotification('Chapter created successfully', 'success');
      }
      setShowModal(false);
      fetchChapters(parseInt(selectedSubject));
    } catch {
      showNotification('Failed to save chapter', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteDialog({ isOpen: true, chapterId: id });
  };

  const confirmDeleteChapter = async () => {
    if (!deleteDialog.chapterId) return;
    try {
      setDeleting(deleteDialog.chapterId);
      setDeleteDialog({ isOpen: false, chapterId: null });
      await subjectService.deleteChapter(deleteDialog.chapterId);
      showNotification('Chapter deleted successfully', 'success');
      fetchChapters(parseInt(selectedSubject));
    } catch {
      showNotification('Failed to delete chapter', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const selectedSubjectName = subjectId
    ? subjects.find(s => s.id === parseInt(subjectId))?.name || 'Subject'
    : subjects.find(s => s.id === parseInt(selectedSubject))?.name || '';

  return (
    <div className="space-y-6 pb-12">
        <PageHeader
          title="Chapters"
          subtitle={subjectId ? `Managing chapters for: ${selectedSubjectName}` : "Manage chapter content for each subject"}
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Subjects", href: "/admin/subjects" },
              ...(subjectId ? [{ label: selectedSubjectName, href: "/admin/subjects" }] : []),
              { label: "Chapters", active: true }
            ]
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
                <p className="text-sm text-slate-500">Total Subjects</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{chapters.length}</p>
                <p className="text-sm text-emerald-600">Chapters{selectedSubject && ` in ${selectedSubjectName}`}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <List className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {selectedSubject && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-700">{chapters.length}</p>
                  <p className="text-sm text-purple-600">Total Chapters</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSubject && (
          <FilterBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onReset={() => setSearchTerm('')}
            searchPlaceholder="Search chapters..."
          >
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Chapter
            </Button>
          </FilterBar>
        )}

        {!selectedSubject ? (
          <EmptyState
            icon={BookOpen}
            title="Select a subject"
            description="Choose a subject from the dropdown to view and manage its chapters"
          />
        ) : loading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : filteredChapters.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Chapter Name</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                        {chapter.sequenceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{chapter.name}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(chapter)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          disabled={deleting === chapter.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={List}
            title="No chapters found"
            description="This subject doesn't have any chapters yet. Add your first chapter to get started."
            action={{
              label: "Add Chapter",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingChapter ? 'Edit Chapter' : 'Add Chapter'}
          size="md"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleFieldChange('subjectId', parseInt(e.target.value))}
                disabled={!!editingChapter}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value={0}>Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="mt-1 text-xs text-red-500">{errors.subjectId}</p>}
            </div>
            <InputField
              label="Chapter Name"
              placeholder="Enter chapter name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={errors.name}
            />
            <InputField
              label="Sequence Number"
              type="number"
              placeholder="Order number"
              value={formData.sequenceNumber || ''}
              onChange={(e) => handleFieldChange('sequenceNumber', parseInt(e.target.value) || 1)}
              error={errors.sequenceNumber}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editingChapter ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </BaseModal>

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, chapterId: null })}
          onConfirm={confirmDeleteChapter}
          title="Delete Chapter"
          message="Are you sure you want to delete this chapter? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      </div>
  );
};

export default Chapters;

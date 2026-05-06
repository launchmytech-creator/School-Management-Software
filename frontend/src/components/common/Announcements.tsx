import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { announcementService, type Announcement, type CreateAnnouncementDto } from '../../services/announcementService';
import { Megaphone, Plus, Edit2, Trash2, Calendar, User } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/modals/BaseModal';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { Button } from '../../components/ui/button';
import FormField from '../../components/ui/FormField';
import { SkeletonTable } from '../../components/common/Skeleton';
import { useAnnouncements } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, type AnnouncementFormData } from '../../schemas/academic.schema';

interface AnnouncementsProps {
  layout: 'admin' | 'teacher' | 'accountant' | 'parent';
}

const Announcements: React.FC<AnnouncementsProps> = ({ layout }) => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const { data: announcements = [], isLoading } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const isAdmin = layout === 'admin';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  });

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTargetRoleLabel = (role: string | null) => {
    switch (role) {
      case 'accountant': return 'Accountant';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'school_admin': return 'Admin';
      default: return 'All Users';
    }
  };

  const getTargetRoleColor = (role: string | null) => {
    switch (role) {
      case 'accountant': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'parent': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'school_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    reset({
      title: '',
      message: '',
      targetRole: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    reset({
      title: announcement.title,
      message: announcement.message,
      targetRole: (announcement.targetRole as AnnouncementFormData['targetRole']) || undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const payload: CreateAnnouncementDto = {
        title: data.title,
        message: data.message,
      };
      if (data.targetRole) {
        payload.targetRole = data.targetRole;
      }

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, payload);
        showNotification('Announcement updated successfully', 'success');
      } else {
        await announcementService.createAnnouncement(payload);
        showNotification('Announcement created successfully', 'success');
      }
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all(null) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save announcement';
      showNotification(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      setDeleting(deleteDialog.id);
      await announcementService.deleteAnnouncement(deleteDialog.id);
      showNotification('Announcement deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all(null) });
    } catch {
      showNotification('Failed to delete announcement', 'error');
    } finally {
      setDeleting(null);
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  const breadcrumbLinks = (() => {
    const base = layout === 'parent' ? '/parent' : `/${layout}`;
    return [
      { label: 'Dashboard', href: `${base}/dashboard` },
      { label: 'Announcements', active: true },
    ];
  })();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Announcements"
        subtitle={isAdmin ? "Create and manage school-wide announcements" : "Stay updated with school notifications"}
        breadcrumb={{ links: breadcrumbLinks }}
        actions={isAdmin ? [
          {
            label: "New Announcement",
            icon: Plus,
            onClick: handleOpenCreate
          }
        ] : undefined}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{announcements.length}</p>
            <p className="text-sm text-slate-500">Total Announcements</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
            <Megaphone className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      <FilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm('')}
        searchPlaceholder="Search announcements..."
      />

      {isLoading ? (
        <SkeletonTable columns={4} rows={5} />
      ) : filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-slate-900">{announcement.title}</h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTargetRoleColor(announcement.targetRole)}`}>
                        {getTargetRoleLabel(announcement.targetRole)}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{announcement.message}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{announcement.createdByName || 'Admin'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenEdit(announcement)}
                      className="p-2 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, id: announcement.id })}
                      disabled={deleting === announcement.id}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description={isAdmin ? "Create your first announcement to keep everyone informed" : "You will see announcements here when they are posted"}
          action={isAdmin ? {
            label: "Create Announcement",
            icon: Plus,
            onClick: handleOpenCreate
          } : undefined}
        />
      )}

      {isAdmin && (
        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <FormField
              label="Title"
              placeholder="Enter announcement title"
              registration={register('title')}
              error={errors.title}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea
                {...register('message')}
                placeholder="Enter announcement message"
                rows={5}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.message ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.message && <span className="text-red-500 text-xs mt-1">{errors.message.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Role</label>
              <select
                {...register('targetRole')}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                <option value="accountant">Accountant</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Leave empty to broadcast to all users</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingAnnouncement ? 'Update' : 'Publish'}
              </Button>
            </div>
          </form>
        </BaseModal>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={!!deleting}
      />
    </div>
  );
};

export default Announcements;
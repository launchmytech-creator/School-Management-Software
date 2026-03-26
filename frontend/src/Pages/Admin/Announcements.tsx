import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { announcementService, type Announcement, type CreateAnnouncementDto } from '../../services/announcementService';
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { SkeletonTable } from '../../components/common/Skeleton';

const Announcements: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateAnnouncementDto>({
    title: '',
    message: '',
    targetRole: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch {
      showNotification('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTargetRoleLabel = (role: string | null) => {
    switch (role) {
      case 'accountant': return 'Accountant';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      default: return 'All Users';
    }
  };

  const getTargetRoleColor = (role: string | null) => {
    switch (role) {
      case 'accountant': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'teacher': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'parent': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      targetRole: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      targetRole: announcement.targetRole || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.message) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    if (formData.title.length < 5) {
      showNotification('Title must be at least 5 characters', 'error');
      return;
    }

    if (formData.message.length < 10) {
      showNotification('Message must be at least 10 characters', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const payload: CreateAnnouncementDto = {
        title: formData.title,
        message: formData.message,
      };

      if (formData.targetRole) {
        payload.targetRole = formData.targetRole;
      }

      console.log('Payload sent:', JSON.stringify(payload, null, 2));

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, payload);
        showNotification('Announcement updated successfully', 'success');
      } else {
        await announcementService.createAnnouncement(payload);
        showNotification('Announcement created successfully', 'success');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      const message = error instanceof Error ? error.message : 'Failed to save announcement';
      showNotification(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      setDeleting(id);
      await announcementService.deleteAnnouncement(id);
      showNotification('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch {
      showNotification('Failed to delete announcement', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Announcements"
          subtitle="Create and manage school-wide announcements"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Announcements", active: true }
            ]
          }}
          actions={[
            {
              label: "New Announcement",
              icon: Plus,
              onClick: handleOpenCreate
            }
          ]}
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

        {loading ? (
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
                        <span>By: {announcement.createdByName || 'Admin'}</span>
                        <span>•</span>
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenEdit(announcement)}
                      className="p-2 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deleting === announcement.id}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
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
            icon={Megaphone}
            title="No announcements found"
            description="Create your first announcement to keep everyone informed"
            action={{
              label: "Create Announcement",
              icon: Plus,
              onClick: handleOpenCreate
            }}
          />
        )}

        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
          size="lg"
        >
          <div className="p-6 space-y-4">
            <InputField
              label="Title"
              placeholder="Enter announcement title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter announcement message"
                rows={5}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Role</label>
              <select
                value={formData.targetRole || ''}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
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
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editingAnnouncement ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default Announcements;

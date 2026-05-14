import React, { useState } from 'react';
import type { SchoolAdmin } from '../../../types/school';
import { useUpdateSchoolAdmin } from '../../../hooks/queries/useSchools';

interface SchoolAdminTabProps {
  admin: SchoolAdmin | null;
  isLoading: boolean;
}

const SchoolAdminTab: React.FC<SchoolAdminTabProps> = ({ admin, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const updateMutation = useUpdateSchoolAdmin();

  const handleEdit = () => {
    if (admin) {
      setFormData({
        fullName: admin.fullName || '',
        email: admin.email || '',
        phone: admin.phone || '',
        password: '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (admin) {
      const updates: { fullName?: string; email?: string; phone?: string; password?: string } = {};
      if (formData.fullName !== admin.fullName) updates.fullName = formData.fullName;
      if (formData.email !== admin.email) updates.email = formData.email;
      if (formData.phone !== admin.phone) updates.phone = formData.phone;
      if (formData.password) updates.password = formData.password;

      if (Object.keys(updates).length > 0) {
        updateMutation.mutate(
          { schoolId: String(admin.schoolId), data: updates },
          {
            onSuccess: () => setIsEditing(false),
          }
        );
      } else {
        setIsEditing(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-2xl">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">person_off</span>
        <p className="text-sm font-bold text-slate-400">No school admin found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest">School Administrator</h4>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="h-10 px-6 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all cursor-pointer"
          >
            Edit Admin
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                New Password (optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current"
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="h-12 px-8 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-12 px-8 rounded-xl bg-[#4A9FD4] text-white font-bold text-sm hover:bg-[#4A9FD4]/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#1E3A5F] flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
              {(admin.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-lg font-bold text-slate-700">{admin.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-bold text-slate-700">{admin.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-sm font-bold text-slate-700">{admin.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                <p className="text-sm font-bold text-slate-700">{admin.role || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span className={`text-[10px] font-black px-3 py-1 rounded-md tracking-wider uppercase ${
                  admin.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</p>
                <p className="text-sm font-bold text-slate-700">
                  {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminTab;

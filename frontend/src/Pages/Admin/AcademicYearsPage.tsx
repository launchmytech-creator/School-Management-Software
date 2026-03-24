import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { academicYearService } from '../../services/academicYearService';
import { useNotification } from '../../context/NotificationContext';
import type { AcademicYear, CreateAcademicYearDto } from '../../types/academicYear';
import { Plus, Edit2, Trash2, CheckCircle, Calendar, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';
import { cn, getCurrentAcademicYear } from '../../lib/utils';

const AcademicYearsPage: React.FC = () => {
  const { allYears, refreshYears, loading: contextLoading } = useAcademicYear();
  const { showNotification } = useNotification();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSetCurrentModalOpen, setIsSetCurrentModalOpen] = useState(false);
  
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [yearToSetCurrent, setYearToSetCurrent] = useState<AcademicYear | null>(null);
  
  const [formData, setFormData] = useState<CreateAcademicYearDto>({
    name: '',
    startDate: '',
    endDate: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingYear(null);
    setFormData({ name: '', startDate: '', endDate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingYear) {
        await academicYearService.updateYear(editingYear.id, formData);
        showNotification('Academic year updated successfully', 'success');
      } else {
        await academicYearService.createYear(formData);
        showNotification('Academic year created successfully', 'success');
      }
      await refreshYears();
      setIsModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save academic year';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!yearToDelete) return;
    setIsSubmitting(true);
    try {
      await academicYearService.deleteYear(yearToDelete.id);
      showNotification('Academic year deleted successfully', 'success');
      await refreshYears();
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete academic year';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async () => {
    if (!yearToSetCurrent) return;
    setIsSubmitting(true);
    try {
      await academicYearService.setCurrentYear(yearToSetCurrent.id);
      showNotification(`${yearToSetCurrent.name} is now the active academic year`, 'success');
      await refreshYears();
      setIsSetCurrentModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to set active year';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Academic Years">
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Settings</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-500">Academic Years</span>
            </div>
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Academic Years</h1>
          </div>
          <Button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus className="size-5" />
            Add New Year
          </Button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Year Name</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Start Date</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">End Date</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allYears.map((year) => (
                  <tr key={year.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <span className="font-black text-slate-700 text-[15px] tracking-tight">{year.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 font-bold text-sm tracking-tight">
                        {new Date(year.startDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 font-bold text-sm tracking-tight">
                        {new Date(year.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {year.isCurrent ? (
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-fit">
                          <CheckCircle className="size-3" />
                          Currently Active
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {!year.isCurrent && (
                          <button 
                            onClick={() => {
                              setYearToSetCurrent(year);
                              setIsSetCurrentModalOpen(true);
                            }}
                            className="p-2 hover:bg-white rounded-lg hover:shadow-sm text-slate-400 hover:text-emerald-500 transition-all title='Set as Active'"
                          >
                            <CheckCircle className="size-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEditModal(year)}
                          className="p-2 hover:bg-white rounded-lg hover:shadow-sm text-slate-400 hover:text-amber-500 transition-all"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button 
                          disabled={year.isCurrent}
                          onClick={() => {
                            setYearToDelete(year);
                            setIsDeleteModalOpen(true);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            year.isCurrent 
                              ? "text-slate-200 cursor-not-allowed" 
                              : "hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-500 cursor-pointer"
                          )}
                          title={year.isCurrent ? "Cannot delete the active year" : "Delete Year"}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {allYears.length === 0 && !contextLoading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                      No academic years found. Click "Add New Year" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
                {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <InputField
                label="Academic Year Name"
                placeholder={`e.g. ${getCurrentAcademicYear()}`}
                icon="calendar_today"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Start Date"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <InputField
                  label="End Date"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 py-6 rounded-xl font-bold"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                >
                  {isSubmitting ? 'Saving...' : editingYear ? 'Update Year' : 'Create Year'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && yearToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="size-8" />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 mb-2 tracking-tight">Delete Year?</h3>
            <p className="text-slate-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{yearToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 py-6 rounded-xl font-bold"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                disabled={isSubmitting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-rose-500/20"
                onClick={handleDelete}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Set Current Confirmation Modal */}
      {isSetCurrentModalOpen && yearToSetCurrent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <Calendar className="size-8" />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 mb-2 tracking-tight">Set as Active Year?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Set <span className="font-bold text-slate-700">"{yearToSetCurrent.name}"</span> as the active year? 
              All new records (students, fees, attendance) will be created under this year by default.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 py-6 rounded-xl font-bold"
                onClick={() => setIsSetCurrentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                disabled={isSubmitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                onClick={handleSetCurrent}
              >
                {isSubmitting ? 'Updating...' : 'Set Active'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AcademicYearsPage;

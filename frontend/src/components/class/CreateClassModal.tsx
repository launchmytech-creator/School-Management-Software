import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import InputField from '../ui/InputField';
import { classService } from '../../services/classService';
import { teacherService } from '../../services/teacherService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import type { CreateClassDto } from '../../types/class';
import type { Teacher } from '../../types/teacher';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateClassDto, 'academicYearId'>>({
    name: '',
    section: '',
    inchargeId: undefined,
    defaultFeeAmount: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data.filter(t => t.isActive));
    } catch {
      showNotification('Failed to fetch teachers', 'error');
    } finally {
      setLoadingTeachers(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen, fetchTeachers]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    if (!selectedYear?.id) {
      newErrors.academicYear = 'Please select an academic year first';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await classService.createClass({
        name: formData.name,
        section: formData.section || undefined,
        inchargeId: formData.inchargeId,
        defaultFeeAmount: formData.defaultFeeAmount || undefined,
        academicYearId: selectedYear!.id,
      });
      showNotification('Class created successfully!', 'success');
      onSuccess();
      onClose();
      setFormData({ name: '', section: '', inchargeId: undefined, defaultFeeAmount: 0 });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message || error.message || 'Failed to create class';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
            Add New Class
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className={`p-4 rounded-2xl flex items-center justify-between mb-4 ${errors.academicYear ? 'bg-red-50/50 border border-red-200' : 'bg-blue-50/50 border border-blue-100'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${errors.academicYear ? 'text-red-600' : 'text-blue-600'}`}>Target Year</span>
            <span className={`text-sm font-black ${errors.academicYear ? 'text-red-700' : 'text-blue-700'}`}>{selectedYear?.name || 'None Selected'}</span>
          </div>
          {errors.academicYear && <p className="text-red-500 text-xs -mt-3">{errors.academicYear}</p>}

          <InputField
            label="Class Name"
            placeholder="e.g. Class 1, Kindergarten, etc."
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={errors.name}
          />

          <InputField
            label="Section"
            placeholder="e.g. A, B, Red, Blue"
            value={formData.section}
            onChange={(e) => handleFieldChange('section', e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Class Incharge
            </label>
            <select
              value={formData.inchargeId || ''}
              onChange={(e) => handleFieldChange('inchargeId', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={loadingTeachers}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">{loadingTeachers ? 'Loading teachers...' : 'Select class incharge (optional)'}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">Class incharge can mark student attendance</p>
          </div>

          <InputField
            label="Default Fee Amount"
            type="number"
            placeholder="25000"
            value={formData.defaultFeeAmount?.toString()}
            onChange={(e) => handleFieldChange('defaultFeeAmount', Number(e.target.value))}
          />

          <div className="pt-4 flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1 py-6 rounded-xl font-bold"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !selectedYear}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : 'Create Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;

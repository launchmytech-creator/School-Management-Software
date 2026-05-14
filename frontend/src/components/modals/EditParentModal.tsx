import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import FormField from '../ui/FormField';
import FormSelect from '../ui/FormSelect';
import { parentService } from '../../services/parentService';
import { useNotification } from '../../context/NotificationContext';
import type { Parent } from '../../types/parent';
import { editParentSchema, type EditParentFormData } from '../../schemas/staff.schema';

interface EditParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  onSuccess: () => void;
}

const EditParentModal: React.FC<EditParentModalProps> = ({ isOpen, onClose, parent, onSuccess }) => {
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditParentFormData>({
    resolver: zodResolver(editParentSchema),
  });

  useEffect(() => {
    if (parent && isOpen) {
      reset({
        fullName: parent.fullName || '',
        phone: parent.phone || '',
        dob: parent.dateOfBirth || '',
        gender: (parent.gender?.toLowerCase() as 'male' | 'female' | 'other') || '',
        address: parent.address || '',
      });
    }
  }, [parent, isOpen, reset]);

  const onSubmit = async (data: EditParentFormData) => {
    if (!parent) return;
    try {
      await parentService.updateParent(parent.id, {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dob,
        gender: data.gender,
        address: data.address,
      });
      showNotification('Parent updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message || error.message || 'Failed to update parent';
      showNotification(message, 'error');
    }
  };

  if (!isOpen || !parent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
            Edit Parent
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <FormField
            label="Full Name"
            placeholder="e.g. John Doe"
            registration={register('fullName')}
            error={errors.fullName}
          />

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              Email Address
            </label>
            <input
              type="email"
              value={parent.email}
              disabled
              className="w-full bg-slate-100 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              placeholder="+1234567890"
              registration={register('phone')}
              error={errors.phone}
            />
            <FormField
              label="Date of Birth"
              type="date"
              registration={register('dob')}
              error={errors.dob}
            />
          </div>

          <FormSelect
            label="Gender"
            registration={register('gender')}
            error={errors.gender}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="Select Gender"
          />

          <FormField
            label="Address"
            placeholder="Enter full address"
            registration={register('address')}
            error={errors.address}
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
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-blue-500/20"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditParentModal;

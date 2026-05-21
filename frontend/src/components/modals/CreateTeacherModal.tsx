import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import FormField from '../ui/FormField';
import FormSelect from '../ui/FormSelect';
import { teacherService } from '../../services/teacherService';
import { useNotification } from '../../context/NotificationContext';
import { createTeacherSchema, type CreateTeacherFormData } from '../../schemas/staff.schema';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
  });

  const onSubmit = async (data: CreateTeacherFormData) => {
    try {
      await teacherService.createTeacher({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        dateOfBirth: data.dob,
        gender: (data.gender.charAt(0).toUpperCase() + data.gender.slice(1)) as 'Male' | 'Female' | 'Other',
        address: data.address,
      });
      showNotification('Teacher created successfully!', 'success');
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message || error.message || 'Failed to create teacher';
      showNotification(message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">
            Add New Teacher
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              placeholder="e.g. Dr. Robert Wilson"
              registration={register('fullName')}
              error={errors.fullName}
            />
            <FormField
              label="Email Address"
              type="email"
              placeholder="teacher@school.com"
              registration={register('email')}
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              registration={register('password')}
              error={errors.password}
              onToggleEye={() => setShowPassword(!showPassword)}
            />
            <FormField
              label="Phone Number"
              placeholder="+1234567890"
              registration={register('phone')}
              error={errors.phone}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Date of Birth"
              type="date"
              registration={register('dob')}
              error={errors.dob}
            />
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
          </div>

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
              Create Teacher
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeacherModal;

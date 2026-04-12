import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import InputField from '../ui/InputField';
import { parentService } from '../../services/parentService';
import { useNotification } from '../../context/NotificationContext';
import type { Parent, UpdateParentDto } from '../../types/parent';

interface EditParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  onSuccess: () => void;
}

const EditParentModal: React.FC<EditParentModalProps> = ({ isOpen, onClose, parent, onSuccess }) => {
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateParentDto>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  });

  React.useEffect(() => {
    if (parent && isOpen) {
      setFormData({
        fullName: parent.fullName || '',
        phone: parent.phone || '',
        dateOfBirth: parent.dateOfBirth || '',
        gender: parent.gender || '',
        address: parent.address || '',
      });
    }
  }, [parent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent) return;
    setIsSubmitting(true);
    try {
      await parentService.updateParent(parent.id, formData);
      showNotification('Parent updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message || error.message || 'Failed to update parent';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <InputField
            label="Full Name"
            placeholder="e.g. John Doe"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <InputField
            label="Email Address"
            type="email"
            value={parent.email}
            disabled
            className="bg-slate-100 cursor-not-allowed"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Phone Number"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <InputField
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <InputField
            label="Address"
            placeholder="Enter full address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditParentModal;

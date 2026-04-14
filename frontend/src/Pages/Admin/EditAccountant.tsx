import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X,
  Phone,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Save,
  UserPlus
} from 'lucide-react';
import { accountantService } from '../../services/accountantService';
import { useNotification } from '../../context/NotificationContext';
import { getLocalDateString } from '../../lib/utils';
import PageHeader from '../../components/common/PageHeader';
import { useAccountantById } from '../../hooks/queries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editAccountantSchema, type EditAccountantFormData } from '../../schemas/staff.schema';

const EditAccountant: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const { data: accountant, isLoading } = useAccountantById(Number(id));

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<Omit<EditAccountantFormData, 'email'>>({
    resolver: zodResolver(editAccountantSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      dob: '',
      gender: 'male',
      address: '',
      isActive: true,
    },
  });

  const watchIsActive = watch('isActive');

  useEffect(() => {
    if (accountant) {
      reset({
        fullName: accountant.fullName,
        phone: accountant.phone || '',
        dob: accountant.dateOfBirth ? getLocalDateString(new Date(accountant.dateOfBirth)) : '',
        gender: (accountant.gender?.toLowerCase() || 'male') as 'male' | 'female' | 'other',
        address: accountant.address || '',
        isActive: accountant.isActive,
      });
    }
  }, [accountant, reset]);

  const onSubmit = async (data: Omit<EditAccountantFormData, 'email'>) => {
    if (!id) return;
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        phone: data.phone || null,
        dob: data.dob || null,
        gender: data.gender,
        address: data.address || null,
        isActive: data.isActive,
      };
      
      await accountantService.updateAccountant(parseInt(id), payload);
      showNotification('Accountant updated successfully!', 'success');
      navigate('/admin/accountants');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update accountant.';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Edit Accountant"
        subtitle="Update accountant information"
        breadcrumb={{
          links: [
            { label: "People", href: "/admin/accountants" },
            { label: "Edit Accountant", active: true },
          ],
        }}
      />

      <div className="max-w-4xl mx-auto pb-20">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
              <div className="bg-blue-50 p-2 rounded-xl">
                <UserPlus className="text-blue-500 size-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Information</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="text" required
                      placeholder="e.g. John Accountant"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                      {...register('fullName')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="tel"
                      placeholder="e.g. 1234567890"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                      {...register('phone')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="date"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                      {...register('dob')}
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-2 px-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                  <div className="flex gap-8">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" value={g}
                          className="size-5 border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer" 
                          {...register('gender')}
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 size-4 text-slate-400" />
                  <textarea 
                    rows={3} placeholder="e.g. 456 Oak Avenue"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                    {...register('address')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Account Status */}
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
              <div className={`p-2 rounded-xl ${watchIsActive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {watchIsActive ? <CheckCircle2 className="text-emerald-500 size-6" /> : <XCircle className="text-rose-500 size-6" />}
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Status</h2>
            </div>

            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  className="sr-only peer"
                  {...register('isActive')}
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-4 text-sm font-bold text-slate-700 uppercase tracking-widest">
                  {watchIsActive ? 'Active Staff' : 'Inactive / Deactivated'}
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button 
              type="button" onClick={() => navigate('/admin/accountants')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
            >
              <X className="size-5" />
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="size-5" />
              )}
              {loading ? 'Saving...' : 'Update Accountant'}
            </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountant;

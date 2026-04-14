import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Save,
  X,
  Phone,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { accountantService } from '../../services/accountantService';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import { addAccountantSchema, type AddAccountantFormData } from '../../schemas/staff.schema';

const AddAccountant: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddAccountantFormData>({
    resolver: zodResolver(addAccountantSchema),
  });

  const onSubmit = async (data: AddAccountantFormData) => {
    try {
      await accountantService.createAccountant({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        dateOfBirth: data.dob || null,
        address: data.address || null,
      });
      showNotification('Accountant created successfully!', 'success');
      navigate('/admin/accountants');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create accountant.';
      showNotification(message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Add Accountant"
        subtitle="Add a new accountant to the school"
        breadcrumb={{
          links: [
            { label: "People", href: "/admin/accountants" },
            { label: "Add Accountant", active: true },
          ],
        }}
      />

      <div className="max-w-4xl mx-auto pb-20">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                      type="text" {...register('fullName')}
                      placeholder="e.g. John Accountant"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="tel" {...register('phone')}
                      placeholder="e.g. 1234567890"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="date" {...register('dob')}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                </div>
                <div className="space-y-4 pt-2 px-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                  <div className="flex gap-8">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" {...register('gender')} value={g}
                          className="size-5 border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer" 
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{g}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 size-4 text-slate-400" />
                  <textarea 
                    {...register('address')} rows={3} placeholder="e.g. 456 Oak Avenue"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                  />
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
              <div className="bg-emerald-50 p-2 rounded-xl">
                <Lock className="text-emerald-500 size-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Security</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    type="email" {...register('email')}
                    placeholder="accountant@school.com"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    type="password" {...register('password')}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6">
            <button 
              type="button" onClick={() => navigate('/admin/accountants')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
            >
              <X className="size-5" />
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Save className="size-5" />
              Create Accountant
            </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountant;

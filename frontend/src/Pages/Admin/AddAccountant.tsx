import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AddAccountant: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone || null,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address || null,
      };
      
      await accountantService.createAccountant(payload);
      showNotification('Accountant created successfully!', 'success');
      navigate('/admin/accountants');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create accountant.';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Accountants</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-500">Add New Accountant</span>
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Add New Accountant</h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight mt-1">Create a new accountant account for managing school finances.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                      type="text" name="fullName" required value={formData.fullName} onChange={handleChange}
                      placeholder="e.g. John Accountant"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="e.g. 1234567890"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
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
                      type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-2 px-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                  <div className="flex gap-8">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange}
                          className="size-5 border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer" 
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
                    name="address" rows={3} placeholder="e.g. 456 Oak Avenue" value={formData.address} onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Account Security */}
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
                    type="email" name="email" required value={formData.email} onChange={handleChange}
                    placeholder="accountant@school.com"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    type="password" name="password" required value={formData.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
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
              {loading ? 'Creating...' : 'Create Accountant'}
            </button>
          </div>
      </form>
    </div>
  );
};

export default AddAccountant;

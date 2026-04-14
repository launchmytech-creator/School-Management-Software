import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  User, Mail, Phone, Calendar, 
  ChevronLeft, Loader2, Clock,
  MapPin
} from "lucide-react";
import { accountantService } from "../../services/accountantService";
import { useNotification } from "../../context/NotificationContext";
import { useAccountantById } from "../../hooks/queries";
import { queryKeys } from "../../lib/queryKeys";

const AccountantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  const { data: accountant, isLoading } = useAccountantById(Number(id));
  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (!accountant || !id) return;
    setToggling(true);
    try {
      await accountantService.updateAccountant(parseInt(id), { 
        isActive: !accountant.isActive 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountant.byId(null, Number(id)) });
      showNotification(
        accountant.isActive ? 'Accountant deactivated successfully!' : 'Accountant activated successfully!',
        'success'
      );
    } catch {
      showNotification('Failed to update status', 'error');
    } finally {
      setToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="size-12 animate-spin text-blue-500 opacity-50" />
        <p className="font-display font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (!accountant) return null;

  return (
    <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/admin/accountants")}
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:shadow-md transition-all active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Accountants</span>
              <span className="text-slate-200">/</span>
              <span className="text-blue-500">Profile</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${accountant.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
            <div className={`size-2 rounded-full ${accountant.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {accountant.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
              
              <div className="relative inline-block mb-6">
                <div className="size-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${accountant.fullName}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-1 right-1 size-6 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{accountant.fullName}</h2>
              <div className="inline-flex px-4 py-1.5 bg-emerald-50 text-emerald-500 text-[11px] font-black rounded-full uppercase tracking-widest mb-2">
                Accountant
              </div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">ID: #{accountant.id.toString().padStart(4, '0')}</p>

              <div className="space-y-4 text-left border-t border-slate-50 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <Mail size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Email</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{accountant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <Phone size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Phone</p>
                    <p className="text-sm font-bold text-slate-700">{accountant.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Date of Birth</p>
                    <p className="text-sm font-bold text-slate-700">{accountant.dateOfBirth ? new Date(accountant.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Gender</p>
                    <p className="text-sm font-bold text-slate-700">{accountant.gender || 'Not set'}</p>
                  </div>
                </div>
                {accountant.address && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Address</p>
                      <p className="text-sm font-bold text-slate-700">{accountant.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={() => navigate(`/admin/accountants/${id}/edit`)}
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={handleToggleStatus}
                  disabled={toggling}
                  className={`w-full py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                    accountant.isActive 
                      ? 'border-rose-100 text-rose-500 hover:bg-rose-50' 
                      : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
                  }`}
                >
                  {toggling ? 'Updating...' : accountant.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Attendance */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Attendance</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Attendance Record</p>
                </div>
              </div>
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                <Clock className="size-12 mb-3 opacity-20" />
                <p className="font-bold text-sm">Attendance Not Available</p>
                <p className="text-xs font-medium mt-1">Staff attendance tracking coming soon</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantProfile;
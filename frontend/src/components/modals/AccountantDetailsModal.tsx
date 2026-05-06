import React from "react";
import { 
  X, Mail, Phone, Calendar, MapPin, 
  User, CheckCircle2, XCircle
} from "lucide-react";

interface AccountantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountant: {
    id: number;
    employeeId: string;
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    isActive: boolean;
    joinedDate: string;
    schoolId?: number;
    avatar: string;
  } | null;
}

const AccountantDetailsModal: React.FC<AccountantDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  accountant 
}) => {
  if (!isOpen || !accountant) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative h-32 bg-slate-900 overflow-hidden uppercase">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
           <button 
             onClick={onClose}
             className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
           >
             <X className="size-5" />
           </button>
        </div>

        {/* Content Section */}
        <div className="px-10 pb-10 -mt-16 relative">
           <div className="flex items-end justify-between mb-8">
              <div className="relative">
                 <div className="size-32 bg-white rounded-[2.5rem] p-2 shadow-xl shadow-slate-200">
                    <div className="w-full h-full bg-blue-50 text-blue-500 rounded-[2.2rem] flex items-center justify-center font-black text-4xl border border-blue-100">
                       {accountant.avatar}
                    </div>
                 </div>
                 <div className={`absolute bottom-2 right-2 size-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${
                    accountant.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                 }`}>
                    {accountant.isActive ? <CheckCircle2 className="size-4 text-white" /> : <XCircle className="size-4 text-white" />}
                 </div>
              </div>
              <div className="pb-2">
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                    accountant.isActive 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                 }`}>
                    <div className={`size-2 rounded-full ${accountant.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    {accountant.isActive ? 'Active Staff' : 'Inactive'}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              {/* Profile Main Info */}
              <div>
                 <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">{accountant.fullName}</h2>
                 <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee ID: <span className="text-blue-500 ml-1">#{accountant.employeeId}</span></span>
                    <div className="size-1 bg-slate-200 rounded-full" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">School ID: <span className="text-indigo-500 ml-1">#{accountant.schoolId || "1"}</span></span>
                    <div className="size-1 bg-slate-200 rounded-full" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Joined: <span className="text-slate-600 ml-1">{accountant.joinedDate}</span></span>
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3 group hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 border border-slate-100 transition-colors">
                       <Mail className="size-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Email</p>
                       <p className="text-sm font-bold text-slate-700 mt-0.5">{accountant.email}</p>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3 group hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 border border-slate-100 transition-colors">
                       <Phone className="size-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</p>
                       <p className="text-sm font-bold text-slate-700 mt-0.5">{accountant.phone}</p>
                    </div>
                 </div>
              </div>

              {/* Detailed Info List */}
              <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-start gap-4">
                       <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <Calendar className="size-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                          <p className="text-sm font-bold text-slate-700 mt-1">{new Date(accountant.dateOfBirth).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <User className="size-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                          <p className="text-sm font-bold text-slate-700 mt-1">{accountant.gender}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 col-span-2">
                       <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <MapPin className="size-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Address</p>
                          <p className="text-sm font-bold text-slate-700 mt-1 leading-relaxed">{accountant.address}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-4 pt-4">
                 <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    View Complete Log
                 </button>
                 <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                    Print ID Card
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDetailsModal;

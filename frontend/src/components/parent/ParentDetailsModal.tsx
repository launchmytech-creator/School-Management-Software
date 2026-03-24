import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, MapPin, Calendar, 
  User, Link2, Unlink2, Loader2, GraduationCap,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { parentService } from '../../services/parentService';
import type { Parent, LinkedStudent } from '../../types/parent';
import { useNotification } from '../../context/NotificationContext';
import LinkStudentModal from './LinkStudentModal';

interface ParentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  onUpdate: () => void;
}

const ParentDetailsModal: React.FC<ParentDetailsModalProps> = ({ 
  isOpen, onClose, parent, onUpdate 
}) => {
  const { showNotification } = useNotification();
  const [children, setChildren] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<number | null>(null);

  const fetchChildren = React.useCallback(async () => {
    if (!parent) return;
    setLoading(true);
    try {
      const data = await parentService.getParentChildren(parent.id);
      setChildren(data);
    } catch {
      showNotification('Failed to fetch linked children', 'error');
    } finally {
      setLoading(false);
    }
  }, [parent, showNotification]);

  useEffect(() => {
    if (isOpen && parent) {
      fetchChildren();
    }
  }, [isOpen, parent, fetchChildren]);

  const handleUnlink = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to unlink this student?")) return;
    
    setUnlinking(studentId);
    try {
      await parentService.unlinkStudent(studentId);
      showNotification('Student unlinked successfully', 'success');
      setChildren(prev => prev.filter(s => s.id !== studentId));
      onUpdate();
    } catch {
      showNotification('Failed to unlink student', 'error');
    } finally {
      setUnlinking(null);
    }
  };

  if (!isOpen || !parent) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        
        <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] animate-in fade-in zoom-in duration-300">
          
          {/* Left Panel - Profile Card */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center">
             <div className="size-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20 mb-6">
                {parent.fullName.charAt(0)}
             </div>
             
             <h2 className="text-2xl font-display font-black text-slate-900 text-center tracking-tight mb-1">{parent.fullName}</h2>
             <span className="px-3 py-1 bg-white border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-full mb-8">Parent Account</span>

             <div className="w-full space-y-4">
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                   <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Mail className="size-4" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{parent.email}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                   <div className="size-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Phone className="size-4" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
                      <p className="text-sm font-bold text-slate-700">{parent.phone || "N/A"}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                   <div className="size-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <User className="size-4" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Gender</p>
                      <p className="text-sm font-bold text-slate-700">{parent.gender || "Not specified"}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* Modal Header */}
             <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">Parent Profile Details</h3>
                   <p className="text-slate-500 font-medium text-sm">Managing linked children and personal information.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="size-6" />
                </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Additional Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                         <Calendar className="size-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Date of Birth</span>
                      </div>
                      <p className="font-bold text-slate-900">{parent.dateOfBirth ? new Date(parent.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                         <MapPin className="size-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Address</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{parent.address || 'N/A'}</p>
                   </div>
                </div>

                {/* Children Section */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-lg font-display font-black text-slate-900 uppercase tracking-tight">
                         Linked Children
                         <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs ml-2">{children.length}</span>
                      </h4>
                      <Button 
                        onClick={() => setIsLinkModalOpen(true)}
                        className="bg-[#2596be] hover:bg-[#1a7a9c] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                         <Link2 className="size-3.5 mr-2" />
                         Link Student
                      </Button>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                          <Loader2 className="size-8 text-blue-500 animate-spin mb-3" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching children...</p>
                        </div>
                      ) : children.length > 0 ? (
                        children.map(child => (
                          <div key={child.id} className="group bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                             <div className="flex items-center gap-5">
                                <div className="size-14 bg-gradient-to-br from-slate-50 to-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-50 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                   <GraduationCap className="size-7" />
                                </div>
                                <div>
                                   <p className="font-display font-black text-slate-900 text-lg tracking-tight mb-1">{child.fullName}</p>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {child.admissionNumber}</span>
                                      <span className="size-1 bg-slate-200 rounded-full"></span>
                                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                         {child.className} {child.classSection}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost"
                                  onClick={() => handleUnlink(child.id)}
                                  disabled={unlinking === child.id}
                                  className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 px-3 h-10 rounded-xl"
                                >
                                   {unlinking === child.id ? <Loader2 className="size-4 animate-spin text-rose-500" /> : <Unlink2 className="size-5" />}
                                </Button>
                                <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl">
                                   <ChevronRight className="size-5" />
                                </button>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 opacity-60">
                           <div className="size-16 bg-white rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                             <GraduationCap className="size-8 text-slate-300" />
                           </div>
                           <p className="text-sm font-bold text-slate-500">No children linked to this parent</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Students must be linked for fee payments & results</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Footer */}
             <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Calendar className="size-3" /> Joined {new Date(parent.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-3">
                   <Button 
                     variant="outline"
                     className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
                   >
                     Reset Password
                   </Button>
                   <Button 
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                   >
                     Update Profile
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <LinkStudentModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        parentId={parent.id}
        parentName={parent.fullName}
        onSuccess={() => {
          fetchChildren();
          onUpdate();
        }}
      />
    </>
  );
};

export default ParentDetailsModal;

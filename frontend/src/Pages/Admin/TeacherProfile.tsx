import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { 
  User, Mail, Phone, Calendar, 
  BookOpen, ChevronLeft, Loader2, Clock,
  GraduationCap, ShieldCheck
} from "lucide-react";
import { teacherService } from "../../services/teacherService";
import { useNotification } from "../../context/NotificationContext";
import type { Teacher, TeacherAllocation } from "../../types/teacher";
import RequiresActiveYear from "../../components/academicYear/RequiresActiveYear";

const TeacherProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // State
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [tData, aData] = await Promise.all([
        teacherService.getTeacherById(Number(id)),
        teacherService.getAllocationsByTeacher(Number(id))
      ]);
      setTeacher(tData);
      setAllocations(aData);
    } catch {
      showNotification("Failed to fetch teacher profile", "error");
      navigate("/admin/teachers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  if (loading) {
    return (
      <AdminLayout title="Teacher Profile">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="size-12 animate-spin text-blue-500 opacity-50" />
          <p className="font-display font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Loading Profile...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!teacher) return null;

  return (
    <AdminLayout title={`Profile: ${teacher.fullName}`}>
      <RequiresActiveYear>
        <div className="space-y-8 pb-20">
          {/* Back Button & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/admin/teachers")}
                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:shadow-md transition-all active:scale-95"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Teacher Management</span>
                  <span className="text-slate-200">/</span>
                  <span className="text-blue-500">Profile View</span>
                </div>
                <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Teacher Profile</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  Active Status
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Personal Info Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 flex flex-col items-center text-center">
                <div className="size-32 bg-blue-50 text-blue-500 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-inner mb-6 relative group overflow-hidden">
                   {teacher.fullName.charAt(0)}
                   <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">{teacher.fullName}</h2>
                <p className="text-slate-400 font-bold text-sm mt-1">{teacher.email}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                   <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center gap-1 border border-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher ID</span>
                      <span className="text-sm font-black text-slate-700">#{teacher.id.toString().padStart(4, '0')}</span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center gap-1 border border-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</span>
                      <span className="text-sm font-black text-slate-700">{teacher.role}</span>
                   </div>
                </div>

                <div className="w-full space-y-4 mt-8 pt-8 border-t border-slate-50">
                   <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="size-8 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Phone className="size-4" />
                         </div>
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{teacher.phone || 'Not provided'}</span>
                   </div>
                   <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="size-8 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Calendar className="size-4" />
                         </div>
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">DOB</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : 'Not set'}</span>
                   </div>
                   <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="size-8 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <User className="size-4" />
                         </div>
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gender</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{teacher.gender}</span>
                   </div>
                </div>
              </div>

              {/* Badges / Metrics */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center">
                       <ShieldCheck className="size-6 text-blue-400" />
                    </div>
                    <div>
                       <h4 className="font-black text-sm uppercase tracking-widest">Verified Faculty</h4>
                       <p className="text-white/40 text-[10px] font-bold mt-0.5">Academic Staff Profile</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Classes</span>
                       <span className="font-display font-black text-xl">{[...new Set(allocations.map(a => a.classId))].length}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Subjects</span>
                       <span className="font-display font-black text-xl">{[...new Set(allocations.map(a => a.subjectId))].length}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column: Assignments & Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Academic Assignments Section */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">Current Assignments</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject Allocations</p>
                    </div>
                  </div>
                </div>

                {allocations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allocations.map((alloc) => (
                      <div key={alloc.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 border border-slate-100 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <BookOpen className="size-5" />
                           </div>
                           <div>
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">{alloc.subjectCode}</span>
                              <h4 className="font-bold text-slate-900 text-base">{alloc.subjectName}</h4>
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mt-1">Class {alloc.className}-{alloc.classSection}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Year</span>
                           <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-100">{alloc.yearName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <Clock className="size-12 mb-3 opacity-20" />
                    <p className="font-bold text-sm">No assignments currently linked to this teacher.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions / Integration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white flex items-center justify-between group cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                    <div>
                       <h4 className="font-black text-lg">Send Notice</h4>
                       <p className="text-emerald-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Email this teacher</p>
                    </div>
                    <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <Mail className="size-6" />
                    </div>
                 </div>
                 <div className="bg-slate-100 rounded-[2.5rem] p-8 text-slate-600 flex items-center justify-between group cursor-not-allowed">
                    <div>
                       <h4 className="font-black text-lg">Leave Requests</h4>
                       <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Coming Soon</p>
                    </div>
                    <div className="size-12 bg-white rounded-2xl flex items-center justify-center opacity-30">
                       <Clock className="size-6" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </RequiresActiveYear>
    </AdminLayout>
  );
};

export default TeacherProfile;

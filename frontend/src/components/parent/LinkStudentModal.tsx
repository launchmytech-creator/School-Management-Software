import React, { useState, useEffect } from 'react';
import { 
  X, Search, Loader2, UserPlus, 
  GraduationCap, Hash, CheckCircle2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { studentService } from '../../services/studentService';
import { parentService } from '../../services/parentService';
import type { Student } from '../../types/student';
import { useNotification } from '../../context/NotificationContext';

interface LinkStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: number;
  parentName: string;
  onSuccess: () => void;
}

const LinkStudentModal: React.FC<LinkStudentModalProps> = ({ 
  isOpen, onClose, parentId, parentName, onSuccess 
}) => {
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setStudents([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await studentService.getStudents({ search: searchTerm });
      // Filter out students who already have a parent or are already linked to THIS parent
      setStudents(data.filter(s => !s.parentId));
    } catch {
      showNotification('Failed to search students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (studentId: number) => {
    setLinking(studentId);
    try {
      await parentService.linkStudent(parentId, studentId);
      showNotification('Student linked successfully', 'success');
      setStudents(prev => prev.filter(s => s.id !== studentId));
      onSuccess();
    } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to link student';
       showNotification(message, 'error');
    } finally {
      setLinking(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div>
            <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Link Student</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Search and link a child to {parentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Search Box */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or admission number..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-32 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-0 h-auto font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Search Now'}
            </Button>
          </div>

          {/* Results List */}
          <div className="min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <Loader2 className="size-8 text-blue-500 animate-spin mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching Database...</p>
              </div>
            ) : students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 rounded-[1.5rem] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm transition-all group-hover:scale-110">
                      <GraduationCap className="size-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-900 tracking-tight leading-none">{student.fullName}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Hash className="size-3" /> {student.admissionNumber}
                        </span>
                        <span className="size-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          {student.className} {student.classSection}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleLink(student.id)}
                    disabled={linking === student.id}
                    className="bg-white border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-all group-hover:shadow-lg group-hover:shadow-blue-500/10 active:scale-95"
                  >
                    {linking === student.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="size-3 mr-1.5" />
                        Link Child
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : searchTerm ? (
               <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Search className="size-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">No unlinked students found</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <UserPlus className="size-10 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500 text-center px-10">Start by searching for a student's name or admission number</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Student-Parent Linking System</p>
        </div>
      </div>
    </div>
  );
};

export default LinkStudentModal;

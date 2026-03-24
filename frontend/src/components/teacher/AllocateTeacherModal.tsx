import React, { useState, useEffect } from "react";
import { 
  X, Search, Plus, Loader2, ChevronRight 
} from "lucide-react";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { teacherService } from "../../services/teacherService";
import { useNotification } from "../../context/NotificationContext";
import type { 
  Teacher, 
  CreateAllocationDto,
  SimpleSubject,
  SimpleClass
} from "../../types/teacher";
import { Button } from "../ui/button";

interface AllocateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AllocateTeacherModal: React.FC<AllocateTeacherModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { allYears, selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SimpleSubject[]>([]);
  const [classes, setClasses] = useState<SimpleClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [form, setForm] = useState<CreateAllocationDto>({
    teacherId: 0,
    subjectId: 0,
    classId: 0,
    academicYearId: selectedYear ? Number(selectedYear.id) : 0,
  });

  // Fetch Data
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [tData, sData, cData] = await Promise.all([
            teacherService.getTeachers(),
            teacherService.getSubjects(),
            teacherService.getClasses()
          ]);
          setTeachers(tData);
          setSubjects(sData);
          setClasses(cData);
        } catch {
          showNotification("Failed to fetch dropdown data", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, showNotification]);

  // Sync with selectedYear
  useEffect(() => {
    if (selectedYear) {
      setForm(prev => ({ ...prev, academicYearId: Number(selectedYear.id) }));
    }
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId || !form.subjectId || !form.classId || !form.academicYearId) {
      showNotification("Please fill all fields", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.createAllocation(form);
      showNotification("Teacher allocated successfully!", "success");
      onSuccess();
      onClose();
      // Reset form (except year)
      setForm(prev => ({ 
        ...prev, 
        teacherId: 0, 
        subjectId: 0, 
        classId: 0 
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to allocate teacher";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">New Allocation</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="size-10 animate-spin text-blue-500 opacity-50" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Teacher Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 px-1">
                  Select Teacher
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 py-3.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value={0}>Search teacher name...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <ChevronRight className="size-4 text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 px-1">
                  Select Subject
                </label>
                <div className="relative">
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value={0}>Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <ChevronRight className="size-4 text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Class and Section */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 px-1">
                    Select Class
                  </label>
                  <div className="relative">
                    <select
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value={0}>Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <ChevronRight className="size-4 text-slate-300 rotate-90" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 px-1">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 outline-none appearance-none cursor-not-allowed"
                    >
                      <option>{classes.find(c => c.id === form.classId)?.section || 'A'}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <ChevronRight className="size-4 text-slate-200 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 px-1">
                  Academic Year
                </label>
                <div className="relative">
                  <select
                    value={form.academicYearId}
                    onChange={(e) => setForm({ ...form, academicYearId: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {allYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <ChevronRight className="size-4 text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-bold text-sm tracking-tight transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin mx-auto" />
                ) : (
                  <>
                     <Plus className="size-5" />
                     Add Allocation
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocateTeacherModal;

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useClassById } from "../../hooks/queries/useClasses";
import { useStudents, useAllStudents } from "../../hooks/queries/useStudents";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import {
  useSubjectsByClass,
  useClassProgress,
  useAllAllocations,
} from "../../hooks/queries";
import { useAcademicYear } from "../../context/AcademicYearContext";
import AdminStatCard from "../../components/dashboard/AdminStatCard";
import {
  BookOpen,
  Users,
  Plus,
  Download,
  Edit,
  Library,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Circle,
  Loader2,
  Eye,
  Shield
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useSubjectChapters } from "../../hooks/queries";

// Sub-component for chapters list
const SubjectChapters: React.FC<{ 
  classId: string | number, 
  subjectId: number, 
  academicYearId: string | number 
}> = ({ classId, subjectId, academicYearId }) => {
  const { data: chapters = [], isLoading } = useSubjectChapters(classId, subjectId, academicYearId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading chapters...</span>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic">
        No chapters defined
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2 pt-4 border-t border-slate-50">
      {chapters.map((chapter) => (
        <div 
          key={chapter.chapterId}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100/50"
        >
          <div className="flex items-center gap-3">
             {chapter.status === 'completed' ? (
               <CheckCircle2 className="size-4 text-emerald-500" />
             ) : chapter.status === 'in-progress' ? (
               <Clock3 className="size-4 text-amber-500" />
             ) : (
               <Circle className="size-4 text-slate-300" />
             )}
             <span className="text-sm font-bold text-slate-700">
               Ch. {chapter.sequenceNumber}: {chapter.chapterName}
             </span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            chapter.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
            chapter.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {chapter.status || 'pending'}
          </span>
        </div>
      ))}
    </div>
  );
};

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();

  const { data: classData, isLoading: loadingClass } = useClassById(id || "");
  const { data: allStudents = [] } = useAllStudents();
  const students = allStudents.filter(s => s.currentClassId?.toString() === id);
  const { data: subjects = [] } = useSubjectsByClass(id || "");
  const { data: allocations = [] } = useAllAllocations();
  const { data: progress = [] } = useClassProgress(id || "");
  const deleteClass = useDeleteClass();

  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    loading: false,
  });

  const handleDelete = () => {
    if (!id) return;
    setDeleteDialog({ isOpen: true, loading: false });
  };

  const confirmDeleteClass = () => {
    if (!id) return;
    setDeleteDialog({ ...deleteDialog, loading: true });
    deleteClass.mutate(id, {
      onSuccess: () => {
        navigate("/admin/classes");
      },
      onSettled: () => {
        setDeleteDialog({ isOpen: false, loading: false });
      },
    });
  };

  if (loadingClass) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading class details..." />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Class not found</p>
      </div>
    );
  }

  const totalChapters = progress.reduce((sum, s) => sum + s.totalChapters, 0);

  const statCards = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      variant: "blue" as const,
    },
    {
      label: "Total Subjects",
      value: subjects.length,
      icon: Library,
      variant: "amber" as const,
    },
    {
      label: "Active Chapters",
      value: totalChapters,
      icon: BookOpen,
      variant: "emerald" as const,
    },
    {
      label: "Class Incharge",
      value: classData.inchargeName || "Not Assigned",
      icon: Shield,
      variant: "default" as const,
    },
  ];

  const handleEdit = () => {
    // Add edit navigation or modal logic here
    console.log("Edit Class clicked");
  };

  return (
    <div className="space-y-8 pb-12 overflow-x-hidden">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
        <span
          className="hover:text-blue-500 cursor-pointer"
          onClick={() => navigate("/admin/dashboard")}
        >
          Academics
        </span>
        <ChevronRight className="size-4" />
        <span
          className="hover:text-blue-500 cursor-pointer"
          onClick={() => navigate("/admin/classes")}
        >
          Classes
        </span>
        <ChevronRight className="size-4" />
        <span className="text-slate-900 font-bold">
          {classData.name} - Section {classData.section || "A"}
        </span>
      </nav>

      {/* Modern Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
            {classData.name} - Section {classData.section || "A"}
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Academic Session {classData.yearName} •{" "}
            {classData.name.includes("Class") ? "Primary Wing" : "School Unit"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl font-bold h-11 px-6 shadow-sm border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-all"
            onClick={handleDelete}
          >
            Delete Class
          </Button>
          <Button
            variant="outline"
            className="rounded-xl font-bold h-11 px-6 shadow-sm border-slate-200"
          >
            <Download className="size-4 mr-2" />
            Export Report
          </Button>
          <Button
            className="rounded-xl font-bold h-11 px-6 bg-slate-900 shadow-md"
            onClick={handleEdit}
          >
            <Edit className="size-4 mr-2" />
            Edit Class
          </Button>
        </div>
      </div>

      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, i) => (
          <AdminStatCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Student Directory */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Student Directory
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                <Plus className="size-5" />
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Student Info
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Roll Number
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        onClick={() =>
                          navigate(`/admin/students/${student.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {student.fullName}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Class {classData.name}-
                                {classData.section || "A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold text-sm tracking-tight truncate max-w-[120px]">
                          #
                          {String(student.rollNumber || "000").padStart(3, "0")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/students/${student.id}`);
                              }}
                              title="View Student"
                            >
                              <Eye className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-slate-400 italic"
                      >
                        No students found in this class
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>         
        </div>

        {/* Right Column: Subjects & Chapters */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight px-2">
            Subjects & Chapters
          </h3>

          <div className="flex flex-col gap-4">
            {subjects.length > 0 ? (
              subjects.map((sub) => {
                const subProgress = progress.find(
                  (p) => p.subjectId === sub.subjectId,
                );
                const teacher = allocations.find(
                  (a) =>
                    a.subjectId === sub.subjectId && a.classId === Number(id),
                );

                const isExpanded = expandedSubjectId === sub.subjectId;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setExpandedSubjectId(isExpanded ? null : sub.subjectId)}
                    className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${
                      isExpanded 
                        ? 'shadow-lg border-slate-200' 
                        : 'border-slate-100 shadow-sm hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-slate-900 text-lg tracking-tight mb-1">
                          {sub.subjectName}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          Teacher:{" "}
                          <span className="text-slate-600">
                            {teacher?.teacherName || "Not Assigned"}
                          </span>
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="size-5 text-blue-500" />
                      ) : (
                        <ChevronRight className="size-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                    {subProgress && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                          <span className="text-slate-400">
                            Chapters Progress
                          </span>
                          <span className="text-blue-600">
                            {subProgress.completedChapters}/
                            {subProgress.totalChapters}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${subProgress.progressPercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {isExpanded && id && selectedYear?.id && (
                       <SubjectChapters 
                         classId={id} 
                         subjectId={sub.subjectId} 
                         academicYearId={selectedYear.id} 
                       />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-50/50 p-8 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
                <Library className="size-10 mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-60">
                  No subjects assigned
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, loading: false })}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </div>
  );
};

export default ClassDetail;

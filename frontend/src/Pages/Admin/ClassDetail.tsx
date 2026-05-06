import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { useClassById } from "../../hooks/queries/useClasses";
import { useAllStudents } from "../../hooks/queries/useStudents";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import {
  useSubjectsByClass,
  useAllAllocations,
} from "../../hooks/queries";
import AdminStatCard from "../../components/dashboard/AdminStatCard";
import {
  Users,
  Library,
  ChevronRight,
  Eye,
  Shield,
  Pencil,
  ListChecks,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { Button } from "../../components/ui/button";
import { subjectIcon } from "../../lib/subject-utils";

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: classData, isLoading: loadingClass } = useClassById(id || "");
  const { data: allStudents = [] } = useAllStudents();
  const students = allStudents.filter(
    (s) => s.currentClassId?.toString() === id,
  );
  const { data: subjects = [] } = useSubjectsByClass(id || "");
  const { data: allocations = [] } = useAllAllocations();
  const deleteClass = useDeleteClass();

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    loading: false,
  });

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
      label: "Class Incharge",
      value: classData.inchargeName || "Not Assigned",
      icon: Shield,
      variant: "default" as const,
    },
  ];

  return (
    <div className="space-y-8 pb-12 overflow-x-hidden">
      <PageHeader
        title={classData.name}
        subtitle={`Section ${classData.section || "A"} • ${classData.yearName}`}
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/classes" },
            { label: classData.name, active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat, i) => (
          <AdminStatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Students
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-20">
                      Roll Number
                    </th>
                    <th className="px-3 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Student Info
                    </th>
                    <th className="px-3 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right w-16">
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
                        <td className="px-3 py-3 text-slate-500 font-bold text-sm tracking-tight w-20">
                          #
                          {String(student.rollNumber || "000").padStart(3, "0")}
                        </td>
                        <td className="px-3 py-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm leading-tight truncate">
                                {student.fullName}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {classData.name}-{classData.section || "A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center w-16">
                          <div className="flex items-center justify-center gap-1">
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
                            <button
                              className="text-slate-300 hover:text-amber-600 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/students/${student.id}/edit`);
                              }}
                              title="Edit Student"
                            >
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-12 text-center text-slate-400 italic"
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

        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Subjects
            </h3>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/classes/${id}/subjects`)}
              className="gap-2"
            >
              <ListChecks className="w-4 h-4" />
              Manage Subjects
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {subjects.length > 0 ? (
              subjects.map((sub) => {
                const teacher = allocations.find(
                  (a) =>
                    a.subjectId === sub.subjectId && a.classId === Number(id),
                );

                return (
                  <div
                    key={sub.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <SubjectIcon name={sub.subjectName} />
                          <h4 className="font-black text-slate-900 text-lg tracking-tight">
                            {sub.subjectName}
                          </h4>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          Teacher:{" "}
                          <span className="text-slate-600">
                            {teacher?.teacherName || "Not Assigned"}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="size-5 text-slate-300" />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/classes/${id}/subjects/${sub.subjectId}/chapters`)
                        }
                        className="gap-2 w-full"
                      >
                        <ListChecks className="w-4 h-4" />
                        Manage Chapters
                      </Button>
                    </div>
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

const SubjectIcon: React.FC<{ name: string }> = ({ name }) => {
  const { icon, bg, text } = subjectIcon(name);
  return (
    <div className={`p-2 rounded-lg ${bg}`}>
      <span
        className={`material-symbols-outlined text-lg ${text}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
    </div>
  );
};

export default ClassDetail;

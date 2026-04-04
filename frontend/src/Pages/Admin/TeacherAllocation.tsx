import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  Plus,
  BookOpen,
  Calendar,
  Trash2,
  Edit2,
  ChevronRight,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { teacherService } from "../../services/teacherService";
import { useNotification } from "../../context/NotificationContext";
import type { TeacherAllocation as TeacherAllocationType } from "../../types/teacher";
import { Button } from "../../components/ui/button";
import AllocateTeacherModal from "../../components/teacher/AllocateTeacherModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const TeacherAllocation: React.FC = () => {
  const { showNotification } = useNotification();

  // State
  const [allocations, setAllocations] = useState<TeacherAllocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    allocationId: null as number | null,
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const aData = await teacherService.getAllocations();
      setAllocations(aData);
    } catch {
      showNotification("Failed to fetch allocations", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteAllocation = (id: number) => {
    setDeleteDialog({ isOpen: true, allocationId: id });
  };

  const confirmDeleteAllocation = async () => {
    if (!deleteDialog.allocationId) return;
    try {
      await teacherService.deleteAllocation(deleteDialog.allocationId);
      showNotification("Allocation removed", "success");
      setAllocations((prev) =>
        prev.filter((a) => a.id !== deleteDialog.allocationId),
      );
    } catch {
      showNotification("Failed to delete allocation", "error");
    } finally {
      setDeleteDialog({ isOpen: false, allocationId: null });
    }
  };

  return (
    <AdminLayout title="Teacher Allocation">
      <div className="space-y-10 pb-10">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-display font-black text-slate-800 tracking-tight">
            Teacher Allocation
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 rounded-xl font-bold text-sm tracking-tight transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Plus className="size-4" />
              Add New Allocation
            </Button>
          </div>
        </div>

        {/* Recent Allocations Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">
              Recent Allocations
            </h2>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              Filter by Teacher
              <ChevronRight className="size-3 text-slate-300 rotate-90" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allocations.slice(0, 4).map((alloc) => (
              <div
                key={alloc.id}
                className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                {/* Delete button from image (trash icon in corner) */}
                <button
                  onClick={() => handleDeleteAllocation(alloc.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>

                {/* Avatar (circular as seen in image) */}
                <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 overflow-hidden border-4 border-white shadow-sm">
                  {/* Placeholder for real avatar, using simplified SVG/Char */}
                  <div className="text-emerald-500 font-black text-2xl uppercase">
                    {alloc.teacherName.charAt(0)}
                  </div>
                </div>

                <div className="space-y-1 mb-5">
                  <h4 className="font-display font-black text-slate-800 text-base leading-tight tracking-tight">
                    {alloc.teacherName}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    SENIOR FACULTY
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tight inline-block mx-auto">
                    {alloc.subjectName}
                  </span>
                  <span className="bg-slate-50 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tight inline-block mx-auto">
                    {alloc.className}
                  </span>
                </div>

                <div className="w-full flex items-center justify-center gap-2 mt-6 pt-5 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                    <Calendar className="size-3.5" />
                    {alloc.yearName}
                  </div>
                  <span className="text-emerald-500 font-bold text-[10px]">
                    Active
                  </span>
                </div>
              </div>
            ))}
            {allocations.length === 0 && !loading && (
              <div className="col-span-full py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
                <BookOpen className="size-10 mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-60">
                  No allocations found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Allocation Summary Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-7 flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">
              Allocation Summary
            </h2>
            <button className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors text-xs font-bold shadow-none p-0">
              <Plus className="size-4" />
              Export PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-y border-slate-100">
                  <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Teacher
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                    Class
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                    Section
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                    Year
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc) => (
                  <tr
                    key={alloc.id}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 font-black text-xs overflow-hidden border border-slate-100">
                          {alloc.teacherName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm tracking-tight">
                          {alloc.teacherName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-500 text-sm font-medium tracking-tight">
                        {alloc.subjectName}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-slate-500 text-sm font-medium tracking-tight">
                        Class {alloc.className}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-slate-500 text-sm font-medium tracking-tight">
                        {alloc.classSection}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-slate-500 text-sm font-medium tracking-tight">
                        {alloc.yearName}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-slate-400 hover:text-blue-500 transition-colors">
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAllocation(alloc.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <Loader2 className="size-10 animate-spin mx-auto text-blue-500 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 animate-pulse">
                        Syncing assignment records...
                      </p>
                    </td>
                  </tr>
                )}
                {allocations.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <p className="text-slate-400 font-bold italic text-sm opacity-50">
                        No assignments have been recorded for the current term.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total {allocations.length} assignment entries
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="p-2 text-slate-200 disabled:opacity-30"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button className="flex items-center justify-center size-9 bg-slate-900 text-white rounded-xl font-black text-xs shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                1
              </button>
              <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AllocateTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, allocationId: null })}
        onConfirm={confirmDeleteAllocation}
        title="Remove Allocation"
        message="Are you sure you want to remove this allocation? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
      />
    </AdminLayout>
  );
};

export default TeacherAllocation;

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses, useTeachers, useAllAllocations } from "../../hooks/queries";
import { classService } from "../../services/classService";
import { teacherService } from "../../services/teacherService";
import { Button } from "../../components/ui/button";
import AllocateTeacherModal from "../../components/teacher/AllocateTeacherModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import ClassInchargeCard from "../../components/teacher/ClassInchargeCard";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import {
  Users,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type FilterOption = "all" | "assigned" | "unassigned";
type TabValue = "incharge" | "allocations";

const TeacherAllocation: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const queryClient = useQueryClient();

  const { data: allocations = [], isLoading } = useAllAllocations();
  const { data: classes = [] } = useClasses(selectedYear?.id);
  const { data: teachers = [] } = useTeachers();

  const [activeTab, setActiveTab] = useState<TabValue>("incharge");
  const [updatingIncharge, setUpdatingIncharge] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    classId: string | null;
    className: string | null;
    teacherId: number | null;
    teacherName: string | null;
    action: "assign" | "remove" | null;
  }>({
    isOpen: false,
    classId: null,
    className: null,
    teacherId: null,
    teacherName: null,
    action: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    allocationId: null as number | null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtering
  const filteredClasses = useMemo(() => {
    if (filterOption === "assigned") {
      return classes.filter((c) => c.inchargeId !== null);
    } else if (filterOption === "unassigned") {
      return classes.filter((c) => c.inchargeId === null);
    }
    return classes;
  }, [classes, filterOption]);

  const sortedAllocations = useMemo(() => {
    return [...allocations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [allocations]);

  const handleAssignIncharge = async () => {
    if (!confirmDialog.classId) return;

    setUpdatingIncharge(parseInt(confirmDialog.classId));
    try {
      await classService.updateClass(confirmDialog.classId, {
        inchargeId: confirmDialog.teacherId,
      });
      showNotification(
        confirmDialog.action === "remove"
          ? "Class incharge removed successfully"
          : "Class incharge assigned successfully",
        "success"
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch {
      showNotification("Failed to update class incharge", "error");
    } finally {
      setUpdatingIncharge(null);
      setConfirmDialog({
        isOpen: false,
        classId: null,
        className: null,
        teacherId: null,
        teacherName: null,
        action: null,
      });
    }
  };

  const openConfirmDialog = (
    classId: string,
    className: string,
    teacherId: number | null,
    teacherName: string | null,
    action: "assign" | "remove"
  ) => {
    setConfirmDialog({
      isOpen: true,
      classId,
      className,
      teacherId,
      teacherName,
      action,
    });
  };

  const handleSetIncharge = (classId: string, teacherId: number | null) => {
    const classData = classes.find((c) => c.id === classId);
    const className = classData?.name || "";
    const teacherData = teachers.find((t) => t.id === teacherId);

    if (teacherId === null) {
      openConfirmDialog(classId, className, null, null, "remove");
    } else {
      openConfirmDialog(classId, className, teacherId, teacherData?.fullName || "", "assign");
    }
  };

  const handleDeleteAllocation = (id: number) => {
    setDeleteDialog({ isOpen: true, allocationId: id });
  };

  const confirmDeleteAllocation = async () => {
    if (!deleteDialog.allocationId) return;
    try {
      await teacherService.deleteAllocation(deleteDialog.allocationId);
      showNotification("Allocation removed", "success");
      queryClient.invalidateQueries({ queryKey: ['teacher-allocations'] });
    } catch {
      showNotification("Failed to delete allocation", "error");
    } finally {
      setDeleteDialog({ isOpen: false, allocationId: null });
    }
  };

  // Pagination for allocations
  const totalPages = Math.ceil(sortedAllocations.length / itemsPerPage);
  const paginatedAllocations = sortedAllocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const assignedCount = classes.filter((c) => c.inchargeId !== null).length;
  const unassignedCount = classes.filter((c) => c.inchargeId === null).length;

  return (
    <>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Teacher Allocation"
          subtitle="Assign teachers to classes and subjects"
          breadcrumb={{
            links: [
              { label: "People", href: "/admin/teacher-allocation" },
              { label: "Teacher Allocation", active: true },
            ],
          }}
        />

        <div className="flex items-center justify-between">
          <div />
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("incharge")}
              className={`flex-1 px-6 py-5 text-sm font-bold transition-colors relative ${
                activeTab === "incharge"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Class Incharge
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "incharge"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {classes.length}
                </span>
              </span>
              {activeTab === "incharge" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("allocations")}
              className={`flex-1 px-6 py-5 text-sm font-bold transition-colors relative ${
                activeTab === "allocations"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Subject Allocations
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "allocations"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {allocations.length}
                </span>
              </span>
              {activeTab === "allocations" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Class Incharge Tab */}
            {activeTab === "incharge" && (
              <div className="space-y-4">
                {/* Filter Bar */}
                <div className="flex items-center gap-3">
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <Filter className="size-4 text-slate-400" />
                      {filterOption === "all" ? "All Classes" : filterOption === "assigned" ? "Assigned" : "Unassigned"}
                      <ChevronDown className={`size-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showFilterDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[160px]">
                          {[
                            { value: "all", label: `All (${classes.length})` },
                            { value: "assigned", label: `Assigned (${assignedCount})` },
                            { value: "unassigned", label: `Unassigned (${unassignedCount})` },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setFilterOption(option.value as FilterOption);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                                filterOption === option.value
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-blue-500 opacity-30" />
                  </div>
                ) : filteredClasses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClasses.map((cls) => (
                      <ClassInchargeCard
                        key={cls.id}
                        classData={cls}
                        teachers={teachers}
                        onAssign={handleSetIncharge}
                        isUpdating={updatingIncharge === parseInt(cls.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No classes found"
                    description={
                      filterOption !== "all"
                        ? "No classes match your filter criteria."
                        : "No classes have been created for this academic year."
                    }
                  />
                )}
              </div>
            )}

            {/* Subject Allocations Tab */}
            {activeTab === "allocations" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-y border-slate-100">
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
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
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedAllocations.map((alloc) => (
                          <tr
                            key={alloc.id}
                            className="group hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-black text-xs">
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
                                {alloc.className}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-slate-500 text-sm font-medium tracking-tight">
                                {alloc.classSection || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-slate-400 font-medium text-xs">
                                <Calendar className="size-3.5" />
                                {alloc.yearName}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleDeleteAllocation(alloc.id)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                  title="Remove Allocation"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {isLoading && (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                              <Loader2 className="size-10 animate-spin mx-auto text-blue-500 opacity-20" />
                            </td>
                          </tr>
                        )}
                        {allocations.length === 0 && !isLoading && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <Users className="size-12 text-slate-200" />
                                <p className="text-slate-400 font-medium">
                                  No subject allocations found
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(currentPage * itemsPerPage, sortedAllocations.length)} of{" "}
                        {sortedAllocations.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="size-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`size-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all ${
                              currentPage === page
                                ? "bg-slate-900 text-white shadow-lg"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AllocateTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['teacher-allocations'] })}
      />

      {/* Incharge Assignment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({
            isOpen: false,
            classId: null,
            className: null,
            teacherId: null,
            teacherName: null,
            action: null,
          })
        }
        onConfirm={handleAssignIncharge}
        title={confirmDialog.action === "remove" ? "Remove Class Incharge" : "Assign Class Incharge"}
        message={
          confirmDialog.action === "remove"
            ? `Are you sure you want to remove the incharge from ${confirmDialog.className}? This class will no longer be able to mark attendance.`
            : `Are you sure you want to assign ${confirmDialog.teacherName} as the incharge for ${confirmDialog.className}?`
        }
        confirmText={confirmDialog.action === "remove" ? "Remove" : "Assign"}
        variant={confirmDialog.action === "remove" ? "danger" : "info"}
      />

      {/* Delete Allocation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, allocationId: null })}
        onConfirm={confirmDeleteAllocation}
        title="Remove Allocation"
        message="Are you sure you want to remove this allocation? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
      />
    </>
  );
};

export default TeacherAllocation;

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Users, Shield, ChevronDown } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  useClasses,
  useTeachers,
  useAllAllocations,
} from "../../hooks/queries";
import { classService } from "../../services/classService";
import { teacherService } from "../../services/teacherService";
import { Button } from "../../components/ui/button";
import AllocateTeacherModal from "../../components/modals/AllocateTeacherModal";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { AllocationTabs } from "../../components/teacher/AllocationTabs";
import { AllocationFilterBar } from "../../components/teacher/AllocationFilterBar";
import { AllocationTable } from "../../components/teacher/AllocationTable";
import EmptyState from "../../components/common/EmptyState";
import { sortByGrade } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [filterOption, setFilterOption] = useState<FilterOption>("all");

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

  const filteredClasses = useMemo(() => {
    let result: typeof classes;
    if (filterOption === "assigned") {
      result = classes.filter((c) => c.inchargeId !== null);
    } else if (filterOption === "unassigned") {
      result = classes.filter((c) => c.inchargeId === null);
    } else {
      result = classes;
    }
    return sortByGrade(result);
  }, [classes, filterOption]);

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
        "success",
      );
      queryClient.invalidateQueries({ queryKey: ["classes"] });
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
    action: "assign" | "remove",
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
      openConfirmDialog(
        classId,
        className,
        teacherId,
        teacherData?.fullName || "",
        "assign",
      );
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
      queryClient.invalidateQueries({ queryKey: ["teacher-allocations"] });
    } catch {
      showNotification("Failed to delete allocation", "error");
    } finally {
      setDeleteDialog({ isOpen: false, allocationId: null });
    }
  };

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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 ">
          <AllocationTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            classesCount={classes.length}
            allocationsCount={allocations.length}
          />

          <div className="p-6">
            {activeTab === "incharge" && (
              <div className="space-y-4">
                <AllocationFilterBar
                  filterOption={filterOption}
                  onChange={setFilterOption}
                  totalCount={classes.length}
                  assignedCount={assignedCount}
                  unassignedCount={unassignedCount}
                />

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-blue-500 opacity-30" />
                  </div>
                ) : filteredClasses.length > 0 ? (
                  <div className="space-y-4">
                    {filteredClasses.map((cls) => {
                      const getAvatarColor = (name: string) => {
                        const colors = [
                          "bg-emerald-100 text-emerald-600",
                          "bg-blue-100 text-blue-600",
                          "bg-purple-100 text-purple-600",
                          "bg-rose-100 text-rose-600",
                          "bg-amber-100 text-amber-600",
                          "bg-cyan-100 text-cyan-600",
                        ];
                        const index = name.charCodeAt(0) % colors.length;
                        return colors[index];
                      };

                      const hasIncharge = !!cls.inchargeId;
                      const isUpdating = updatingIncharge === parseInt(cls.id);
                      const showDropdown = openDropdownId === cls.id;

                      return (
                        <div
                          key={cls.id}
                          className="bg-white rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                  <span className="font-black text-sm">
                                    
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-900">
                                    {cls.name}
                                    {cls.section && ` - Section ${cls.section}`}
                                  </h3>
                                  <p className="text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-1">
                                      <Users className="w-3.5 h-3.5" />
                                      {cls.studentCount} students
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  {hasIncharge && cls.inchargeName ? (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${getAvatarColor(
                                          cls.inchargeName
                                        )}`}
                                      >
                                        {cls.inchargeName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium text-slate-600">
                                        {cls.inchargeName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                                      <Shield className="size-3" />
                                      No incharge
                                    </span>
                                  )}
                                </div>
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenDropdownId(showDropdown ? null : cls.id)}
                                    disabled={isUpdating}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <>
                                        {hasIncharge ? "Change" : "Assign"}
                                        <ChevronDown className={`size-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                                      </>
                                    )}
                                  </button>
                                  {showDropdown && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
                                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[180px]">
                                        <div className="p-1.5">
                                          {hasIncharge && (
                                            <button
                                              onClick={() => {
                                                handleSetIncharge(cls.id, null);
                                                setOpenDropdownId(null);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 rounded-lg"
                                            >
                                              Remove Incharge
                                            </button>
                                          )}
                                          {teachers
                                            .filter((t) => t.isActive && (!hasIncharge || t.id !== cls.inchargeId))
                                            .map((teacher) => (
                                              <button
                                                key={teacher.id}
                                                onClick={() => {
                                                  handleSetIncharge(cls.id, teacher.id);
                                                  setOpenDropdownId(null);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                              >
                                                <div
                                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${getAvatarColor(
                                                    teacher.fullName
                                                  )}`}
                                                >
                                                  {teacher.fullName.charAt(0)}
                                                </div>
                                                <span className="truncate">{teacher.fullName}</span>
                                              </button>
                                            ))}
                                          {teachers.filter((t) => t.isActive).length === 0 && (
                                            <p className="px-3 py-2 text-xs text-slate-400 text-center">
                                              No teachers
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

            {activeTab === "allocations" && (
              <AllocationTable
                allocations={allocations}
                isLoading={isLoading}
                onDelete={handleDeleteAllocation}
              />
            )}
          </div>
        </div>
      </div>

      <AllocateTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["teacher-allocations"] })
        }
      />

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
        title={
          confirmDialog.action === "remove"
            ? "Remove Class Incharge"
            : "Assign Class Incharge"
        }
        message={
          confirmDialog.action === "remove"
            ? `Are you sure you want to remove the incharge from ${confirmDialog.className}? This class will no longer be able to mark attendance.`
            : `Are you sure you want to assign ${confirmDialog.teacherName} as the incharge for ${confirmDialog.className}?`
        }
        confirmText={confirmDialog.action === "remove" ? "Remove" : "Assign"}
        variant={confirmDialog.action === "remove" ? "danger" : "info"}
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
    </>
  );
};

export default TeacherAllocation;

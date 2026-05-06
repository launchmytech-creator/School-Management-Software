import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Users } from "lucide-react";
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
import ClassInchargeCard from "../../components/teacher/ClassInchargeCard";
import { AllocationTabs } from "../../components/teacher/AllocationTabs";
import { AllocationFilterBar } from "../../components/teacher/AllocationFilterBar";
import { AllocationTable } from "../../components/teacher/AllocationTable";
import EmptyState from "../../components/common/EmptyState";
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
    if (filterOption === "assigned") {
      return classes.filter((c) => c.inchargeId !== null);
    } else if (filterOption === "unassigned") {
      return classes.filter((c) => c.inchargeId === null);
    }
    return classes;
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

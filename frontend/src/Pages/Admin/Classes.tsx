import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Eye, Trash2, ChevronRight, Users } from "lucide-react";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import CreateClassModal from "../../components/modals/CreateClassModal";
import ActionMenu from "../../components/ui/ActionMenu";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const { allYears, selectedYear, setSelectedYear } = useAcademicYear();

  const { data: classes = [], isLoading, refetch } = useClasses(selectedYear?.id);
  const deleteClass = useDeleteClass();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    itemId: null as string | null,
    loading: false,
  });

  const filteredClasses = useMemo(() => {
    const searchLow = searchTerm.toLowerCase();
    return classes.filter((cls) => {
      return (
        cls.name.toLowerCase().includes(searchLow) ||
        (cls.section && cls.section.toLowerCase().includes(searchLow))
      );
    });
  }, [classes, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  const handleDeleteClass = (id: string) => {
    setDeleteDialog({ isOpen: true, itemId: id, loading: false });
  };

  const confirmDeleteClass = async () => {
    if (!deleteDialog.itemId) return;
    setDeleteDialog({ ...deleteDialog, loading: true });
    deleteClass.mutate(deleteDialog.itemId, {
      onSettled: () => {
        setDeleteDialog({ isOpen: false, itemId: null, loading: false });
      },
    });
  };

  const getActionMenuItems = (id: string) => [
    { label: "View Detail", icon: <Eye className="size-4" />, onClick: () => navigate(`/admin/classes/${id}`) },
    { label: "Delete", icon: <Trash2 className="size-4" />, onClick: () => handleDeleteClass(id), variant: "danger" as const },
  ];

  return (
    <>
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Academic Classes"
            subtitle="Manage school grades, sections and fee structures"
            breadcrumb={{
              links: [
                { label: "Academics", href: "/admin/classes" },
                { label: "Classes", active: true },
              ],
            }}
          />
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            New Class
          </Button>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={handleResetFilters}
          searchPlaceholder="Search class or section..."
        >
          <div className="relative flex-1 md:w-64">
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
              value={selectedYear?.id || ""}
              onChange={(e) => {
                const year = allYears.find((y) => String(y.id) === e.target.value);
                setSelectedYear(year || null);
              }}
            >
              {allYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </FilterBar>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading classes...</div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes found"
            description="Try adjusting your filters or add a new class."
            action={{ label: "Reset Filters", onClick: handleResetFilters }}
          />
        ) : (
          <div className="space-y-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/classes/${cls.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen className="w-5 h-5" />
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
                          {cls.defaultFeeAmount && (
                            <span className="ml-2">• Fee: ₹{cls.defaultFeeAmount}</span>
                          )}
                          {cls.inchargeName && (
                            <span className="ml-2">• Teacher: {cls.inchargeName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={getActionMenuItems(cls.id)} />
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, itemId: null, loading: false })}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </>
  );
};

export default Classes;

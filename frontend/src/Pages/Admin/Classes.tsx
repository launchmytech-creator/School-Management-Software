import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, BookOpen, Eye, Trash2 } from "lucide-react";
import type { Class } from "../../types/class";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import CreateClassModal from "../../components/class/CreateClassModal";
import ActionMenu from "../../components/ui/ActionMenu";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

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

  const filteredClasses = classes.filter((cls) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      cls.name.toLowerCase().includes(searchLow) ||
      (cls.section && cls.section.toLowerCase().includes(searchLow))
    );
  });

  const groupedClasses = useMemo(() => {
    return filteredClasses.reduce((acc, curr) => {
      if (!acc[curr.name]) acc[curr.name] = [];
      acc[curr.name].push(curr);
      return acc;
    }, {} as Record<string, Class[]>);
  }, [filteredClasses]);

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
      <div className="space-y-6">
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
        ) : Object.keys(groupedClasses).length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes found"
            description="Try adjusting your filters or add a new class."
            action={{ label: "Reset Filters", onClick: handleResetFilters }}
          />
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedClasses).map(([className, sections]) => (
              <div key={className} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                    {className}
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Section
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Students
                        </th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Default Fee
                        </th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sections.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/admin/classes/${s.id}`)}
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                <BookOpen className="size-5" />
                              </div>
                              <span className="font-display font-black text-slate-900 text-lg tracking-tight">
                                Section {s.section || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="size-4 text-slate-400" />
                              <span className="font-display font-black text-slate-900 text-lg">
                                {s.studentCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="font-display font-black text-slate-900 text-lg">
                              {s.defaultFeeAmount ? `₹${s.defaultFeeAmount}` : "--"}
                            </span>
                          </td>
                          <td className="py-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              <ActionMenu items={getActionMenuItems(s.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

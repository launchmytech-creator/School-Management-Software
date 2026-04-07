import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Users, DollarSign, 
  BookOpen, Calendar, Eye, Trash2
} from "lucide-react";
import type { Class } from "../../types/class";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import ViewToggle from "../../components/common/ViewToggle";
import EmptyState from "../../components/common/EmptyState";
import CreateClassModal from "../../components/class/CreateClassModal";
import ActionMenu from "../../components/ui/ActionMenu";
import { SkeletonCard } from "../../components/common/Skeleton";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const { allYears, selectedYear, setSelectedYear } = useAcademicYear();
  
  const { data: classes = [], isLoading } = useClasses(selectedYear?.id);
  const deleteClass = useDeleteClass();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    itemId: null as string | null,
    loading: false,
  });

  const filteredClasses = classes.filter((cls) => {
    const searchLow = searchTerm.toLowerCase();
    return cls.name.toLowerCase().includes(searchLow) || 
           (cls.section && cls.section.toLowerCase().includes(searchLow));
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
    { label: 'View Detail', icon: <Eye className="size-4" />, onClick: () => navigate(`/admin/classes/${id}`) },
    { label: 'Delete', icon: <Trash2 className="size-4" />, onClick: () => handleDeleteClass(id), variant: 'danger' as const },
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
                { label: "Dashboard", href: "/admin/dashboard" },
                { label: "Classes", active: true }
              ]
            }}
          />
          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="size-4" />
              New Class
            </Button>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={handleResetFilters}
          searchPlaceholder="Search class or section..."
        >
          <div className="relative flex-1 md:w-64">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
             <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                value={selectedYear?.id || ""}
                onChange={(e) => {
                  const year = allYears.find(y => String(y.id) === e.target.value);
                  setSelectedYear(year || null);
                }}
             >
                {allYears.map(year => (
                  <option key={year.id} value={year.id}>{year.name} {year.isCurrent ? "(Current)" : ""}</option>
                ))}
             </select>
          </div>
        </FilterBar>

        {isLoading ? (
          <div className="space-y-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-6">
                <SkeletonCard rows={3} />
              </div>
            ))}
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
                   <div className="h-px flex-1 bg-slate-100"></div>
                   <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                     {className}
                   </h2>
                   <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {sections.map((s) => (
                      <div 
                        key={s.id} 
                        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer"
                        onClick={() => navigate(`/admin/classes/${s.id}`)}
                      >
                        <div className="flex items-start justify-between mb-8" onClick={(e) => e.stopPropagation()}>
                          <div className="size-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <BookOpen className="size-8" />
                          </div>
                          <ActionMenu items={getActionMenuItems(s.id)} />
                        </div>
                        
                        <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                          Section {s.section || "N/A"}
                        </h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">{className}</p>

                        <div className="space-y-4 mb-8">
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                 <div className="size-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <Users className="size-4" />
                                 </div>
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Students</span>
                              </div>
                              <span className="font-display font-black text-slate-900 text-lg">
                                {s.studentCount}
                              </span>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                 <div className="size-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                    <DollarSign className="size-4" />
                                 </div>
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Fee</span>
                              </div>
                              <span className="font-display font-black text-slate-900 text-lg">
                                {s.defaultFeeAmount ? `₹${s.defaultFeeAmount}` : "None"}
                              </span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-visible">
                     <table className="w-full text-left border-collapse" style={{ overflow: 'visible' }}>
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-100 px-8">
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Students</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Default Fee</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
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
                                       <span className="font-display font-black text-slate-900 text-lg tracking-tight">Section {s.section || "N/A"}</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <span className="font-display font-black text-slate-900 text-lg">
                                      {s.studentCount}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 text-center text-sm font-bold text-slate-500 tracking-tight">
                                    {s.defaultFeeAmount ? `₹${s.defaultFeeAmount}` : "--"}
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateClassModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
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

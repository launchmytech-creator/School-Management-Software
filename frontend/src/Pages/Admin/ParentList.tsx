import React, { useState, useEffect } from "react";
import { 
  Search, Eye, Edit2, Trash2, 
  UserPlus, Loader2, GraduationCap, 
  Mail, Phone
} from "lucide-react";
import ParentDetailsModal from "../../components/parent/ParentDetailsModal";
import EditParentModal from "../../components/parent/EditParentModal";
import { parentService } from "../../services/parentService";
import type { Parent } from "../../types/parent";
import { useNotification } from "../../context/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import ViewToggle from "../../components/common/ViewToggle";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import CreateParentModal from "../../components/parent/CreateParentModal";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const ParentList: React.FC = () => {
  const { showNotification } = useNotification();
  
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, parentId: null as number | null });

  const fetchParents = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await parentService.getParents();
      setParents(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch parents.";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleDelete = (id: number) => {
    setDeleteDialog({ isOpen: true, parentId: id });
  };

  const confirmDeleteParent = async () => {
    if (!deleteDialog.parentId) return;
    try {
      await parentService.deleteParent(deleteDialog.parentId);
      showNotification("Parent deactivated successfully", "success");
      fetchParents();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to deactivate parent.";
      showNotification(message, "error");
    } finally {
      setDeleteDialog({ isOpen: false, parentId: null });
    }
  };

  const filteredParents = parents.filter((parent) => {
    const searchLow = searchTerm.toLowerCase();
    return parent.fullName.toLowerCase().includes(searchLow) ||
           parent.email.toLowerCase().includes(searchLow) ||
           (parent.phone && parent.phone.includes(searchLow));
  });

  return (
    <>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader 
            title="Parent Accounts"
            subtitle="Manage guardian information and linked students profiles."
            breadcrumb={{
              links: [
                { label: "People", href: "/admin/parents" },
                { label: "Parents", active: true }
              ]
            }}
          />
           <div className="flex items-center gap-3">
              <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <UserPlus className="size-4" />
                New Parent
              </Button>
           </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => setSearchTerm("")}
          searchPlaceholder="Search by name, email, or phone..."
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
             <Loader2 className="size-10 text-blue-500 animate-spin mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Parent Database...</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="No parents found"
            description="Try a different search term or add a new parent."
            action={{ label: "Clear Search", onClick: () => setSearchTerm("") }}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredParents.map((parent) => (
              <div key={parent.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="size-16 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-500 border border-indigo-100 rounded-[1.5rem] flex items-center justify-center text-2xl font-black transition-transform group-hover:scale-110">
                    {parent.fullName.charAt(0)}
                  </div>
                   <div className="flex gap-1">
                      <button onClick={() => { setSelectedParent(parent); setIsDetailsOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                       <Eye className="size-5" />
                      </button>
                      <button onClick={() => { setEditingParent(parent); setIsEditOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                       <Edit2 className="size-4" />
                      </button>
                   </div>
                </div>
                
                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none mb-4 group-hover:text-blue-600 transition-colors uppercase">{parent.fullName}</h3>
                
                <div className="space-y-3 mb-8">
                   <div className="flex items-center gap-3 text-slate-400">
                      <Mail className="size-4" />
                      <span className="text-xs font-bold truncate">{parent.email}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-400">
                      <Phone className="size-4" />
                      <span className="text-xs font-bold">{parent.phone || "No phone added"}</span>
                   </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${parent.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{parent.isActive ? 'Active' : 'Inactive'}</span>
                   </div>
                   <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
                      <GraduationCap className="size-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{parent.childrenCount || 0} Children</span>
                   </div>
                </div>
              </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-50">
                      <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Linked Children</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="pl-6 pr-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredParents.map((parent) => (
                     <tr key={parent.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="pl-10 pr-6 py-6">
                           <div className="flex items-center gap-4">
                              <div className="size-10 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 rounded-xl flex items-center justify-center font-black transition-all group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/20">
                                 {parent.fullName.charAt(0)}
                              </div>
                              <div>
                                 <span className="font-display font-black text-slate-900 tracking-tight block uppercase">{parent.fullName}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">ID: PRT-{parent.id.toString().padStart(4, '0')}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                 <Mail className="size-3 text-slate-300" /> {parent.email}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 <Phone className="size-3 text-slate-200" /> {parent.phone || 'N/A'}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50 shadow-sm transition-all hover:scale-110">
                               <GraduationCap className="size-3" />
                               {parent.childrenCount || 0} Children
                            </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <StatusBadge label={parent.isActive ? 'Active' : 'Inactive'} variant={parent.isActive ? 'success' : 'neutral'} />
                        </td>
                        <td className="pl-6 pr-10 py-6">
                            <div className="flex items-center justify-end gap-2">
                               <button onClick={() => { setSelectedParent(parent); setIsDetailsOpen(true); }} className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                 <Eye className="size-5" />
                               </button>
                               <button onClick={() => { setEditingParent(parent); setIsEditOpen(true); }} className="p-2.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                                 <Edit2 className="size-4" />
                               </button>
                               <button onClick={() => handleDelete(parent.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                 <Trash2 className="size-4" />
                               </button>
                            </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      <ParentDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        parent={selectedParent}
        onUpdate={fetchParents}
      />

      <CreateParentModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchParents}
      />

      <EditParentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        parent={editingParent}
        onSuccess={fetchParents}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, parentId: null })}
        onConfirm={confirmDeleteParent}
        title="Deactivate Parent"
        message="Are you sure you want to deactivate this parent? This will only work if no students are linked."
        confirmText="Deactivate"
        variant="warning"
      />
    </>
  );
};

export default ParentList;

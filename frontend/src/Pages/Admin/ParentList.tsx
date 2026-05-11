import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../context/NotificationContext";
import { useParents } from "../../hooks/queries";
import type { Parent } from "../../types/parent";
import { queryKeys } from "../../lib/queryKeys";
import { parentService } from "../../services/parentService";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import { 
  Search, Eye, Edit2, Trash2, 
  UserPlus, Loader2, GraduationCap, 
  Mail, Phone
} from "lucide-react";
import ParentDetailsModal from "../../components/modals/ParentDetailsModal";
import EditParentModal from "../../components/modals/EditParentModal";
import CreateParentModal from "../../components/modals/CreateParentModal";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";

const ParentList: React.FC = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  const { data: parents = [], isLoading } = useParents();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, parentId: null as number | null });

  const handleDelete = (id: number) => {
    setDeleteDialog({ isOpen: true, parentId: id });
  };

  const confirmDeleteParent = async () => {
    if (!deleteDialog.parentId) return;
    try {
      await parentService.deleteParent(deleteDialog.parentId);
      showNotification("Parent deactivated successfully", "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.parents.all(null) });
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
<Button onClick={() => setIsCreateOpen(true)} className="gap-2">
               <UserPlus className="size-4" />
               New Parent
             </Button>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => setSearchTerm("")}
          searchPlaceholder="Search by name, email, or phone..."
        />

        {isLoading ? (
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
) : (
          <div className="space-y-4">
            {filteredParents.map((parent) => (
              <div
                key={parent.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100 uppercase">
                        {parent.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {parent.fullName}
                        </h3>
                        <p className="text-sm text-slate-500">
                          <span className="text-xs">ID: PRT-{parent.id.toString().padStart(4, '0')}</span>
                          <span className="ml-2">•</span>
                          <span className="ml-2 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {parent.childrenCount || 0} Children
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {parent.email}
                        </p>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {parent.phone || 'N/A'}
                        </p>
                      </div>
                      <StatusBadge label={parent.isActive ? 'Active' : 'Inactive'} variant={parent.isActive ? 'success' : 'neutral'} />
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedParent(parent); setIsDetailsOpen(true); }} className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                          <Eye className="size-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingParent(parent); setIsEditOpen(true); }} className="p-2.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(parent.id); }} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ParentDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        parent={selectedParent}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: queryKeys.parents.all(null) })}
      />

      <CreateParentModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.parents.all(null) })}
      />

      <EditParentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        parent={editingParent}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.parents.all(null) })}
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

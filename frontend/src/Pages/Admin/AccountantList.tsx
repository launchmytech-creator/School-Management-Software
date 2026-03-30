import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { 
  Search, Eye, Edit2, Trash2, 
  UserPlus, Loader2
} from "lucide-react";
import AccountantDetailsModal from "../../components/accountant/AccountantDetailsModal";
import { accountantService, type Accountant } from "../../services/accountantService";
import { useNotification } from "../../context/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const AccountantList: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAccountant, _setSelectedAccountant] = useState<Accountant | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, accountantId: null as number | null });

  const fetchAccountants = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountantService.getAccountants();
      setAccountants(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch accountants.";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAccountants();
  }, [fetchAccountants]);

  const handleDelete = (id: number) => {
    setDeleteDialog({ isOpen: true, accountantId: id });
  };

  const confirmDeleteAccountant = async () => {
    if (!deleteDialog.accountantId) return;
    try {
      await accountantService.deleteAccountant(deleteDialog.accountantId);
      showNotification("Accountant deactivated successfully", "success");
      setAccountants(prev => prev.map(acc => 
        acc.id === deleteDialog.accountantId ? { ...acc, isActive: false } : acc
      ));
      fetchAccountants();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to deactivate accountant.";
      showNotification(message, "error");
    } finally {
      setDeleteDialog({ isOpen: false, accountantId: null });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm(""); 
    setStatusFilter("All Status");
    setStartDate("");
    setEndDate("");
  };

  const filteredAccountants = accountants.filter((accountant) => {
    const searchLow = searchTerm.toLowerCase();
    const fullName = accountant?.fullName || "";
    const email = accountant?.email || "";
    
    const matchesSearch = fullName.toLowerCase().includes(searchLow) ||
                         email.toLowerCase().includes(searchLow);
    
    const matchesStatus = statusFilter === "All Status" || 
                         (statusFilter === "Active" && accountant.isActive) ||
                         (statusFilter === "Inactive" && !accountant.isActive);

    const accountantDate = new Date(accountant.createdAt).getTime();
    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() : null;

    let matchesDate = true;
    if (start && accountantDate < start) matchesDate = false;
    if (end) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (accountantDate > endOfDay.getTime()) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <AdminLayout title="Accountants">
      <div className="space-y-8 pb-10">
        <PageHeader 
          title="Accountant Records"
          subtitle="Manage administrative staff and system accountants"
          actions={[
            {
              label: "Add Accountant",
              icon: UserPlus,
              onClick: () => navigate("/admin/add-accountant")
            }
          ]}
        />

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={handleResetFilters}
          searchPlaceholder="Filter by name or email..."
        >
          <div className="flex-1 w-full md:w-48">
             <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
             >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
             </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <input 
               type="date" 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-[44px]" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
             />
             <span className="text-slate-300 text-xs font-bold uppercase tracking-widest hidden md:inline">to</span>
             <input 
               type="date" 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-[44px]" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
             />
          </div>
        </FilterBar>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px] relative">
           {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10">
               <Loader2 className="size-10 text-blue-500 animate-spin" />
             </div>
           ) : filteredAccountants.length === 0 ? (
              <EmptyState 
                 icon={Search}
                 title="No accountants found"
                 description="We couldn't find any financial staff matching your current filters. Try adjusting your search term or dates."
                 action={{
                   label: "Reset All Filters",
                   onClick: handleResetFilters
                 }}
              />
            ) : (
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Accountant</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                       <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredAccountants.map((accountant) => (
                      <tr key={accountant.id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="size-12 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 rounded-2xl flex items-center justify-center font-black text-lg border border-blue-100 shadow-sm uppercase">
                                  {accountant.fullName ? accountant.fullName.charAt(0) : "?"}
                               </div>
                               <div>
                                  <span className="font-display font-black text-slate-900 text-base tracking-tight block">{accountant.fullName || "Unnamed Accountant"}</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">
                                    Joined: {new Date(accountant.createdAt).toLocaleDateString()}
                                  </span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6 font-bold text-xs text-slate-600 uppercase tracking-widest">
                            <span className={`px-3 py-1 rounded-lg ${
                              accountant.gender === "Male" ? "bg-sky-50 text-sky-600" : 
                              accountant.gender === "Female" ? "bg-rose-50 text-rose-600" : 
                              "bg-slate-50 text-slate-500"
                            }`}>
                              {accountant.gender || "N/A"}
                            </span>
                         </td>
                         <td className="px-6 py-6">
                            <span className="text-sm font-bold text-slate-500">{accountant.email}</span>
                         </td>
                         <td className="px-6 py-6">
                            <span className="text-sm font-bold text-slate-500">{accountant.phone || "N/A"}</span>
                         </td>
                         <td className="px-6 py-6 text-center">
                            <StatusBadge label={accountant.isActive ? 'Active' : 'Inactive'} variant={accountant.isActive ? 'success' : 'neutral'} />
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center justify-end gap-2 px-1">
                                <button 
                                   onClick={() => navigate(`/admin/accountants/${accountant.id}`)}
                                   className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                   <Eye className="size-4" />
                                </button>
                                <button 
                                   onClick={() => navigate(`/admin/accountants/${accountant.id}/edit`)}
                                   className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                   <Edit2 className="size-4" />
                                </button>
                                <button 
                                   onClick={() => handleDelete(accountant.id)}
                                   className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                               >
                                  <Trash2 className="size-4" />
                              </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            )}
         </div>
      </div>

      <AccountantDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        accountant={selectedAccountant ? {
          ...selectedAccountant,
          employeeId: `ACC-${selectedAccountant.id.toString().padStart(4, "0")}`,
          joinedDate: new Date(selectedAccountant.createdAt).toLocaleDateString(),
          schoolId: selectedAccountant.schoolId,
          avatar: (selectedAccountant.fullName || "?").charAt(0),
          phone: selectedAccountant.phone || "N/A",
          dateOfBirth: selectedAccountant.dateOfBirth || "",
          address: selectedAccountant.address || "N/A",
          gender: selectedAccountant.gender || "Not specified"
        } : null}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, accountantId: null })}
        onConfirm={confirmDeleteAccountant}
        title="Deactivate Accountant"
        message="Are you sure you want to deactivate this accountant?"
        confirmText="Deactivate"
        variant="warning"
      />
    </AdminLayout>
  );
};

export default AccountantList;

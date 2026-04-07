import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Trash2, 
  User, 
  UserPlus, 
  Mail, 
  Phone,
  BookOpen
} from "lucide-react";
import { useTeachers } from "../../hooks/queries/useTeachers";
import { useNotification } from "../../context/NotificationContext";
import CreateTeacherModal from "../../components/teacher/CreateTeacherModal";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: teachers = [], isLoading, refetch } = useTeachers();

  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, teacherId: null as number | null });

  const handleDeleteTeacher = (id: number) => {
    setDeleteDialog({ isOpen: true, teacherId: id });
  };

  const confirmDeleteTeacher = () => {
    showNotification("Delete functionality coming soon", "info");
    setDeleteDialog({ isOpen: false, teacherId: null });
  };

  const handleReset = () => {
    setSearchTerm("");
    refetch();
  };

  const filteredTeachers = teachers.filter(t => 
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-8 pb-10">
        <PageHeader 
          title="Teacher Records"
          subtitle="Manage faculty members, contact details and professional profiles"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Teachers", active: true }
            ]
          }}
          actions={[
            {
              label: "Allocate Teacher",
              icon: BookOpen,
              onClick: () => navigate("/admin/teacher-allocation"),
              variant: "secondary"
            },
            {
              label: "Add New Teacher",
              icon: UserPlus,
              onClick: () => setIsCreateTeacherOpen(true)
            }
          ]}
        />

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={handleReset}
          searchPlaceholder="Search by name or email..."
        />

        {isLoading ? (
          <div className="bg-white rounded-[2rem] h-96 flex items-center justify-center border border-slate-100 shadow-sm text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Records...</p>
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="No teachers found"
            description="Try adjusting your search or add a new faculty member."
          />
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Teacher</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact Info</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Gender</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                    <th className="pl-6 pr-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="pl-10 pr-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border-2 border-white transition-transform group-hover:scale-110">
                            {teacher.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-display font-black text-slate-900 text-base tracking-tight block uppercase">
                              {teacher.fullName}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">
                              ID: {teacher.id.toString().padStart(4, '0')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                            <Mail className="size-3.5 text-slate-400" />
                            {teacher.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <Phone className="size-3 text-slate-400" />
                            {teacher.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100 shadow-sm">
                          {teacher.gender}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <StatusBadge label="Active" variant="success" />
                      </td>
                      <td className="pl-6 pr-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                            className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <User className="size-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateTeacherModal 
        isOpen={isCreateTeacherOpen} 
        onClose={() => setIsCreateTeacherOpen(false)} 
        onSuccess={() => refetch()}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, teacherId: null })}
        onConfirm={confirmDeleteTeacher}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This may affect their allocations."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default TeacherList;

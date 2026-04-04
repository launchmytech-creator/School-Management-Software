import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useClassById } from "../../hooks/queries/useClasses";
import { useStudents } from "../../hooks/queries/useStudents";
import { useDeleteClass } from "../../hooks/mutations/useClassMutations";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { BookOpen, Users, DollarSign, Trash2 } from "lucide-react";

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();

  const { data: classData, isLoading: loadingClass } = useClassById(id || '');
  const { data: students = [] } = useStudents({ classId: id, academicYear: selectedYear?.id });
  const deleteClass = useDeleteClass();

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, loading: false });

  const handleDelete = () => {
    if (!id) return;
    setDeleteDialog({ isOpen: true, loading: false });
  };

  const confirmDeleteClass = () => {
    if (!id) return;
    setDeleteDialog({ ...deleteDialog, loading: true });
    deleteClass.mutate(id, {
      onSuccess: () => {
        navigate('/admin/classes');
      },
      onSettled: () => {
        setDeleteDialog({ isOpen: false, loading: false });
      },
    });
  };

  if (loadingClass) {
    return (
      <AdminLayout title="Class Details">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="Loading class details..." />
        </div>
      </AdminLayout>
    );
  }

  if (!classData) {
    return (
      <AdminLayout title="Class Details">
        <div className="text-center py-12">
          <p className="text-slate-500">Class not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Class Details">
      <div className="space-y-6 pb-12">
        <PageHeader
          title={`${classData.name} - Section ${classData.section || 'N/A'}`}
          subtitle={classData.yearName}
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Classes", href: "/admin/classes" },
              { label: classData.name, active: true },
            ],
          }}
          actions={[
            {
              label: "Delete",
              icon: Trash2,
              onClick: handleDelete,
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <BookOpen className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Class</p>
                <p className="text-lg font-bold text-slate-900">{classData.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Students</p>
                <p className="text-lg font-bold text-slate-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <DollarSign className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Default Fee</p>
                <p className="text-lg font-bold text-slate-900">
                  {classData.defaultFeeAmount ? `₹${classData.defaultFeeAmount}` : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Students in this class</h2>
          </div>
          
          {students.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/students/${student.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{student.fullName}</p>
                      <p className="text-sm text-slate-500">Roll No: {student.rollNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="size-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No students found in this class</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, loading: false })}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </AdminLayout>
  );
};

export default ClassDetail;

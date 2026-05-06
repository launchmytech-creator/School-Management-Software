import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { useClassById } from '../../hooks/queries/useClasses';
import { useStudents } from '../../hooks/queries/useStudents';
import { useDeleteStudent } from '../../hooks/mutations';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import Pagination from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

interface StudentClassListProps {
  layout: 'admin' | 'accountant' | 'teacher';
}

const StudentClassList: React.FC<StudentClassListProps> = ({ layout }) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const { data: classData, isLoading: loadingClass } = useClassById(classId || '');
  const deleteStudent = useDeleteStudent();

  const {
    data: students,
    isLoading: loadingStudents,
    pagination,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
  } = useStudents({ classId: classId || '' }, !!classId);

  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; studentId: number | null }>({
    isOpen: false,
    studentId: null,
  });

  const basePath =
    layout === 'admin' ? '/admin' : layout === 'accountant' ? '/accountant' : '/teacher';

  const handleDelete = async () => {
    if (!deleteDialog.studentId) return;
    await deleteStudent.mutateAsync(deleteDialog.studentId);
    setDeleteDialog({ isOpen: false, studentId: null });
  };

  if (loadingClass || loadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading students..." />
      </div>
    );
  }

  if (!classData) {
    return (
      <EmptyState
        icon={Search}
        title="Class not found"
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/students`) }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${classData.name}${classData.section ? ` - Section ${classData.section}` : ''}`}
        subtitle={`${students.length} students`}
        breadcrumb={{
          links: [
            { label: 'Students', href: `${basePath}/students` },
            { label: classData.name, active: true },
          ],
        }}
        actions={
          layout === 'admin'
            ? [
                {
                  label: 'Add Student',
                  icon: Plus,
                  onClick: () => navigate(`${basePath}/add-student`),
                },
              ]
            : undefined
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => {
          setSearchTerm('');
          setPage(1);
        }}
        searchPlaceholder="Search by name or admission number..."
      />

      {students.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Admission #
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-600">
                          {student.admissionNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {student.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{student.fullName}</p>
                            <p className="text-xs text-slate-500">
                              {student.gender} &middot; {student.dateOfBirth || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.parentName || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            student.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : student.status === 'inactive'
                                ? 'bg-slate-100 text-slate-600'
                                : student.status === 'suspended'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/students/${student.id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="size-4" />
                          </button>
                          {layout === 'admin' && (
                            <>
                              <button
                                onClick={() => navigate(`${basePath}/students/${student.id}/edit`)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteDialog({ isOpen: true, studentId: student.id })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No students found"
          description={
            searchTerm
              ? 'Try adjusting your search'
              : 'No students enrolled in this class yet'
          }
          action={
            layout === 'admin'
              ? { label: 'Add Student', onClick: () => navigate(`${basePath}/add-student`) }
              : undefined
          }
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, studentId: null })}
        onConfirm={handleDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default StudentClassList;

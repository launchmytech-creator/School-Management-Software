import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, IndianRupee } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useStudents } from '../../hooks/queries/useStudents';
import { useFeeTransactions } from '../../hooks/queries/useFeeTransactions';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import Pagination from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { computeFeeSummary, formatINR } from '../../lib/fee-utils';
import type { Student } from '../../types/student';

interface StudentFeeRow extends Student {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  paidPercentage: number;
  feeStatusLocal: 'paid' | 'partial' | 'pending' | 'none';
}

interface StudentFeeListProps {
  layout: 'admin' | 'accountant';
}

const StudentFeeList: React.FC<StudentFeeListProps> = ({ layout }) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const {
    data: students,
    isLoading: loadingStudents,
    pagination,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
  } = useStudents({ classId: classId || '' }, !!classId);

  const academicYearId = selectedYear?.id ? parseInt(selectedYear.id) : undefined;
  const { data: allTransactions = [] } = useFeeTransactions({
    classId: classId ? parseInt(classId) : undefined,
    academicYearId,
  });

  const txByStudent = useMemo(() => {
    const map = new Map<number, typeof allTransactions>();
    allTransactions.forEach((tx) => {
      if (!map.has(tx.studentId)) map.set(tx.studentId, []);
      map.get(tx.studentId)!.push(tx);
    });
    return map;
  }, [allTransactions]);

  const studentsWithFee = useMemo(() => {
    return students.map((s) => {
      const txs = txByStudent.get(s.id) || [];
      const summary = computeFeeSummary(txs);
      let feeStatusLocal: StudentFeeRow['feeStatusLocal'] = 'none';
      if (txs.length > 0) {
        if (summary.paidPercentage === 100) feeStatusLocal = 'paid';
        else if (summary.totalPaid > 0) feeStatusLocal = 'partial';
        else feeStatusLocal = 'pending';
      }
      return {
        ...s,
        totalAmount: summary.totalAmount,
        totalPaid: summary.totalPaid,
        totalPending: summary.totalPending,
        paidPercentage: summary.paidPercentage,
        feeStatusLocal,
      };
    });
  }, [students, txByStudent]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (loadingStudents) {
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
        action={{ label: 'Go Back', onClick: () => navigate(`${basePath}/fees`) }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Fee Collection - ${classData.name}`}
        subtitle={
          classData.section
            ? `Section ${classData.section} • ${selectedYear?.name || ''}`
            : selectedYear?.name || ''
        }
        breadcrumb={{
          links: [
            { label: 'Finance', href: `${basePath}/fees` },
            { label: 'Fee Collection', active: true },
          ],
        }}
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

      {studentsWithFee.length > 0 ? (
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
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Total Fee
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Pending
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
                  {studentsWithFee.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`${basePath}/fees/class/${classId}/student/${student.id}`)
                      }
                    >
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
                              {student.parentName || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                        {formatINR(student.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                        {formatINR(student.totalPaid)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">
                        {formatINR(student.totalPending)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.feeStatusLocal !== 'none' ? (
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                              student.feeStatusLocal === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : student.feeStatusLocal === 'partial'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {student.feeStatusLocal.charAt(0).toUpperCase() + student.feeStatusLocal.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No records</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/fees/class/${classId}/student/${student.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <IndianRupee className="size-3.5" />
                          Manage Fees
                        </button>
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
        />
      )}
    </div>
  );
};

export default StudentFeeList;

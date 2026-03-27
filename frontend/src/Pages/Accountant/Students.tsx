import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { feeService } from '../../services/feeService';
import { feeStructureService } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { SkeletonTable } from '../../components/common/Skeleton';

interface StudentWithFees {
  id: string;
  fullName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  parentName: string;
  parentPhone: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  feeStatus: 'paid' | 'pending' | 'partial';
}

interface StudentFromService {
  id: number;
  fullName: string;
  admissionNumber: string;
  currentClassId?: number | null;
  className?: string;
  parentName?: string;
  parentPhone?: string;
}

const AccountantStudents: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithFees[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const types = await feeStructureService.getUniqueFeeTypes();
        setFeeTypes(types);
      } catch {
        // Ignore error
      }
    };
    fetchFeeTypes();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [studentsData, classesData] = await Promise.all([
        studentService.getStudents({ classId: selectedClass || undefined }),
        classService.getClasses()
      ]);

      const classMap = new Map(classesData.map(c => [c.id, c.name]));

      const studentsWithFees: StudentWithFees[] = await Promise.all(
        (studentsData as StudentFromService[]).map(async (s) => {
          const studentId = String(s.id);
          const classIdStr = String(s.currentClassId || '');
          
          try {
            const transactions = await feeService.getStudentFeeTransactions(parseInt(studentId), feeTypeFilter || undefined);
            
            const totalDue = transactions.reduce((sum, t) => sum + (t.amountDue || 0), 0);
            const totalPaid = transactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
            const balance = totalDue - totalPaid;
            
            let feeStatus: 'paid' | 'pending' | 'partial' = 'pending';
            if (balance <= 0) feeStatus = 'paid';
            else if (totalPaid > 0) feeStatus = 'partial';

            return {
              id: studentId,
              fullName: s.fullName || '',
              admissionNumber: s.admissionNumber || studentId,
              classId: classIdStr,
              className: classMap.get(classIdStr) || s.className || 'N/A',
              parentName: s.parentName || 'N/A',
              parentPhone: s.parentPhone || '',
              totalDue,
              totalPaid,
              balance,
              feeStatus,
            };
          } catch {
            return {
              id: studentId,
              fullName: s.fullName || '',
              admissionNumber: s.admissionNumber || studentId,
              classId: classIdStr,
              className: classMap.get(classIdStr) || s.className || 'N/A',
              parentName: s.parentName || 'N/A',
              parentPhone: s.parentPhone || '',
              totalDue: 0,
              totalPaid: 0,
              balance: 0,
              feeStatus: 'pending' as const,
            };
          }
        })
      );

      setStudents(studentsWithFees);
    } catch {
      showNotification('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, feeTypeFilter, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classService.getClasses();
        setClasses(data);
      } catch {
        console.error('Failed to fetch classes');
      }
    };
    fetchClasses();
  }, []);

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    paid: students.filter(s => s.feeStatus === 'paid').length,
    partial: students.filter(s => s.feeStatus === 'partial').length,
    pending: students.filter(s => s.feeStatus === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AccountantLayout title="Students">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-card border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
                <p className="text-sm text-emerald-600">Fee Paid</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-card border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.partial}</p>
                <p className="text-sm text-blue-600">Partial Payment</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-card border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClass(''); setFeeTypeFilter(''); }}
          searchPlaceholder="Search by student, parent, or admission number..."
        >
          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <option value="">All Fee Types</option>
              {feeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={6} rows={8} />
        ) : filteredStudents.length > 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Due</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-accent-sky/20 flex items-center justify-center">
                            <span className="text-accent-sky font-bold text-sm">
                              {student.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{student.fullName}</p>
                            <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.className}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{student.parentName}</div>
                        {student.parentPhone && (
                          <div className="text-xs text-slate-400">{student.parentPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(student.totalDue)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                        {formatCurrency(student.totalPaid)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${
                          student.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {formatCurrency(student.balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(student.feeStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No students found"
            description="No students match your current filters"
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantStudents;

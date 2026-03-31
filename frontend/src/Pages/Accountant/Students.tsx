import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { feeService } from '../../services/feeService';
import { feeStructureService } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import { Users, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { StudentClassGroup } from '../../components/students';

interface EnrichedStudent {
  id: number;
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

const AccountantStudents: React.FC = () => {
  const { showNotification } = useNotification();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<Record<string, EnrichedStudent[]>>({});
  const [loadingClasses, setLoadingClasses] = useState<Set<string>>(new Set());
  const [errorClasses, setErrorClasses] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

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

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    } finally {
      setInitialLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchStudentsForClass = useCallback(async (classObj: Class) => {
    const classIdStr = String(classObj.id);
    
    if (classStudents[classIdStr] || loadingClasses.has(classIdStr)) {
      return;
    }
    
    setLoadingClasses(prev => new Set(prev).add(classIdStr));
    setErrorClasses(prev => {
      const next = new Set(prev);
      next.delete(classIdStr);
      return next;
    });
    
    try {
      const studentsData = await studentService.getStudents({ classId: classObj.id });
      
      const enrichedData: EnrichedStudent[] = await Promise.all(
        studentsData.map(async (s) => {
          const studentId = String(s.id);
          const classIdStr = String(s.currentClassId || '');
          
          try {
            const transactions = await feeService.getStudentFeeTransactions(parseInt(studentId));
            
            const totalDue = transactions.reduce((sum, t) => sum + (t.amountDue || 0), 0);
            const totalPaid = transactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
            const balance = totalDue - totalPaid;
            
            let feeStatus: 'paid' | 'pending' | 'partial' = 'pending';
            if (balance <= 0) feeStatus = 'paid';
            else if (totalPaid > 0) feeStatus = 'partial';

            return {
              id: s.id,
              fullName: s.fullName || '',
              admissionNumber: s.admissionNumber || studentId,
              classId: classIdStr,
              className: s.className || classObj.name || 'N/A',
              parentName: s.parentName || '—',
              parentPhone: s.parentPhone || '',
              totalDue,
              totalPaid,
              balance,
              feeStatus,
            };
          } catch {
            return {
              id: s.id,
              fullName: s.fullName || '',
              admissionNumber: s.admissionNumber || studentId,
              classId: classIdStr,
              className: s.className || classObj.name || 'N/A',
              parentName: s.parentName || '—',
              parentPhone: s.parentPhone || '',
              totalDue: 0,
              totalPaid: 0,
              balance: 0,
              feeStatus: 'pending' as const,
            };
          }
        })
      );
      
      setClassStudents(prev => ({ ...prev, [classIdStr]: enrichedData }));
    } catch {
      setErrorClasses(prev => new Set(prev).add(classIdStr));
      showNotification(`Failed to load students for ${classObj.name}`, 'error');
    } finally {
      setLoadingClasses(prev => {
        const next = new Set(prev);
        next.delete(classIdStr);
        return next;
      });
    }
  }, [classStudents, loadingClasses, showNotification]);

  const handleExpandClass = (classObj: Class) => {
    const classIdStr = String(classObj.id);
    const isCurrentlyExpanded = expandedClasses.has(classIdStr);
    
    if (!isCurrentlyExpanded) {
      fetchStudentsForClass(classObj);
    }
    
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classIdStr)) {
        next.delete(classIdStr);
      } else {
        next.add(classIdStr);
      }
      return next;
    });
  };

  const expandAll = () => {
    classes.forEach(c => {
      const classIdStr = String(c.id);
      if (!expandedClasses.has(classIdStr) && !loadingClasses.has(classIdStr)) {
        fetchStudentsForClass(c);
      }
    });
    const allKeys = classes.map(c => c.id.toString());
    setExpandedClasses(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedClasses(new Set());
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      if (selectedClassFilter && c.id.toString() !== selectedClassFilter) return false;
      return true;
    });
  }, [classes, selectedClassFilter]);

  const classGroups = useMemo(() => {
    return filteredClasses.map(c => ({
      classId: c.id.toString(),
      className: c.name || 'Unassigned',
      classSection: c.section || null,
    })).sort((a, b) => {
      const nameCompare = a.className.localeCompare(b.className);
      if (nameCompare !== 0) return nameCompare;
      return (a.classSection || '').localeCompare(b.classSection || '');
    });
  }, [filteredClasses]);

  const getFilteredStudents = (classId: string): EnrichedStudent[] => {
    const students = classStudents[classId] || [];
    
    return students.filter(s => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!s.fullName?.toLowerCase().includes(search) && 
            !s.admissionNumber?.toLowerCase().includes(search) &&
            !s.parentName?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  const stats = useMemo(() => {
    const allStudents = Object.values(classStudents).flat();
    return {
      totalClasses: classGroups.length,
      totalLoadedStudents: allStudents.length,
      paid: allStudents.filter(s => s.feeStatus === 'paid').length,
      partial: allStudents.filter(s => s.feeStatus === 'partial').length,
      pending: allStudents.filter(s => s.feeStatus === 'pending').length,
    };
  }, [classStudents, classGroups]);

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

  const renderStudentRow = (student: EnrichedStudent) => (
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
  );

  return (
    <AccountantLayout title="Students" subtitle="View student information and fee details">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.totalClasses}</p>
                <p className="text-sm text-slate-500">Total Classes</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
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

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
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

          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
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

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-700">{stats.totalLoadedStudents}</p>
                <p className="text-sm text-slate-500">Students Loaded</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClassFilter(''); setFeeTypeFilter(''); }}
          searchPlaceholder="Search by student, parent, or admission number..."
        >
          <div className="flex items-center gap-3">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
              <ChevronDown className="w-4 h-4" />
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
              <ChevronRight className="w-4 h-4" />
              Collapse All
            </Button>
          </div>
        </FilterBar>

        {initialLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : classGroups.length > 0 ? (
          <div className="space-y-4">
            {classGroups.map((group) => {
              const classObj = classes.find(c => c.id.toString() === group.classId);
              const isExpanded = expandedClasses.has(group.classId);
              const isLoading = loadingClasses.has(group.classId);
              const hasError = errorClasses.has(group.classId);
              const students = getFilteredStudents(group.classId);
              
              return (
                <StudentClassGroup
                  key={group.classId}
                  className={group.className}
                  classSection={group.classSection}
                  students={students}
                  isExpanded={isExpanded}
                  isLoading={isLoading}
                  hasError={hasError}
                  onToggle={() => classObj && handleExpandClass(classObj)}
                >
                  {students.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Due</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map(renderStudentRow)}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      {searchTerm ? 'No students match your search' : 'No students in this class'}
                    </div>
                  )}
                </StudentClassGroup>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No classes found"
            description="No classes are available for the selected filters"
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantStudents;

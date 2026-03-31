import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import StudentFilters from '../../components/Admin/StudentFilters';
import { 
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { feeService } from '../../services/feeService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import type { Student, FeeStatus } from '../../types/student';
import type { Class } from '../../types/class';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StudentClassGroup } from '../../components/students';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

interface ClassGroup {
  classId: string;
  className: string;
  classSection: string | null;
}

interface EnrichedStudent extends Student {
  feeStatus: FeeStatus;
}

const Students: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<Record<string, EnrichedStudent[]>>({});
  const [loadingClasses, setLoadingClasses] = useState<Set<string>>(new Set());
  const [errorClasses, setErrorClasses] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    classId: '',
    section: '',
    academicYear: '',
    status: '',
  });
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, studentId: null as number | null });

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
      const data = await studentService.getStudents({ classId: classObj.id });
      
      const feeStatusMap: Record<number, FeeStatus> = {};
      try {
        const transactions = await feeService.getFeeTransactions({
          academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
        });
        const byStudent = new Map<number, { total: number; paid: number; partial: number }>();
        for (const t of transactions) {
          const existing = byStudent.get(t.studentId) || { total: 0, paid: 0, partial: 0 };
          existing.total += 1;
          if (t.status === 'paid') existing.paid += 1;
          else if (t.status === 'partial') existing.partial += 1;
          byStudent.set(t.studentId, existing);
        }
        for (const [studentId, counts] of byStudent) {
          if (counts.paid === counts.total) {
            feeStatusMap[studentId] = 'Paid';
          } else if (counts.paid > 0 || counts.partial > 0) {
            feeStatusMap[studentId] = 'Partial';
          } else {
            feeStatusMap[studentId] = 'Pending';
          }
        }
      } catch {
        // Fee data unavailable
      }

      const enrichedData: EnrichedStudent[] = data.map(s => ({
        ...s,
        className: s.className || classObj.name || 'Unassigned',
        classSection: s.classSection || classObj.section || 'A',
        parentName: s.parentName || '—',
        feeStatus: feeStatusMap[s.id] || ('N/A' as FeeStatus),
      }));
      
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
  }, [classStudents, loadingClasses, selectedYear, showNotification]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilters({ classId: '', section: '', academicYear: '', status: '' });
    setExpandedClasses(new Set());
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      if (filters.classId && c.id.toString() !== filters.classId) return false;
      return true;
    });
  }, [classes, filters.classId]);

  const classGroups = useMemo((): ClassGroup[] => {
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

  const getFilteredStudents = (classId: string): EnrichedStudent[] => {
    const students = classStudents[classId] || [];
    
    return students.filter(s => {
      if (filters.section && s.classSection !== filters.section) return false;
      if (filters.status && s.status !== filters.status) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!s.fullName?.toLowerCase().includes(search) && 
            !s.parentName?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  const getFeeStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'danger';
      case 'Partial': return 'warning';
      default: return 'neutral';
    }
  };

  const renderStudentRow = (student: EnrichedStudent) => (
    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
      <td className="pl-10 pr-6 py-4">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-transform group-hover:scale-110">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} 
              alt={student.fullName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{student.fullName}</span>
            <span className="text-xs text-slate-400">ID: STU-{student.id.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{student.parentName}</td>
      <td className="px-6 py-4 text-center">
        <StatusBadge 
          label={student.feeStatus || 'N/A'} 
          variant={getFeeStatusVariant(student.feeStatus || '')} 
        />
      </td>
      <td className="pl-6 pr-10 py-4">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => navigate(`/admin/students/${student.id}`)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Eye className="size-4" />
          </button>
          <button 
            onClick={() => navigate(`/admin/students/edit/${student.id}`)}
            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <Edit2 className="size-4" />
          </button>
          <button 
            onClick={() => setDeleteDialog({ isOpen: true, studentId: student.id })}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <AdminLayout title="Students">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Students"
          subtitle="Manage student enrollments, profiles and academic records"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Students", active: true }
            ]
          }}
          actions={[
            {
              label: "Add Student",
              icon: Plus,
              onClick: () => navigate('/admin/add-student')
            }
          ]}
        />

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          onReset={handleReset}
          searchPlaceholder="Search by name or parent..."
        >
          <StudentFilters onFilterChange={handleFilterChange} currentFilters={filters} />
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
                          <th className="pl-10 pr-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Name</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Status</th>
                          <th className="pl-6 pr-10 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map(renderStudentRow)}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      {searchTerm || filters.section || filters.status 
                        ? 'No students match your filters in this class'
                        : 'No students in this class'}
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

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, studentId: null })}
          onConfirm={() => {
            showNotification('Delete functionality coming soon', 'info');
            setDeleteDialog({ isOpen: false, studentId: null });
          }}
          title="Delete Student"
          message="Are you sure you want to delete this student? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
};

export default Students;

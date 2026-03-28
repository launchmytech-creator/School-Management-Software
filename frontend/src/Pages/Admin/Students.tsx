import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import StudentTable from '../../components/Admin/StudentTable';
import StudentFilters from '../../components/Admin/StudentFilters';
import { 
  Plus, 
  Download, 
  FileText
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { feeService } from '../../services/feeService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import type { Student, FeeStatus } from '../../types/student';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { SkeletonTable } from '../../components/common/Skeleton';
import { Button } from '../../components/ui/button';

const Students: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    classId: '',
    section: '',
    academicYear: '',
    status: '',
  });
  const { showNotification } = useNotification();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch ALL students (no backend filters)
      const data = await studentService.getStudents();

      // Fetch all fee transactions to compute per-student fee status
      const feeStatusMap: Record<number, FeeStatus> = {};
      try {
        const transactions = await feeService.getFeeTransactions({
          academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
        });
        // Group by studentId
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
        // Fee data unavailable — leave statuses empty
      }

      const enrichedData = data.map(s => ({
        ...s,
        className: s.className || 'Unassigned',
        classSection: s.classSection || 'A',
        parentName: s.parentName || '—',
        feeStatus: feeStatusMap[s.id] || ('N/A' as FeeStatus),
      }));
      
      setStudents(enrichedData);
    } catch {
      showNotification('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, showNotification]);


  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilters({ classId: '', section: '', academicYear: '', status: '' });
    fetchStudents();
  };

  const filteredStudents = students.filter(s => {
    // Class filter
    if (filters.classId && s.classId?.toString() !== filters.classId) return false;
    // Section filter
    if (filters.section && s.classSection !== filters.section) return false;
    // Academic Year filter
    if (filters.academicYear && s.academicYear !== filters.academicYear) return false;
    // Status filter
    if (filters.status && s.status !== filters.status) return false;
    // Search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!s.fullName?.toLowerCase().includes(search) && 
          !s.parentName?.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <AdminLayout title="Students">
      <div className="space-y-8 pb-12">
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-9">
              <Download className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-9">
              <FileText className="size-4" />
            </Button>
          </div>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={6} rows={8} />
        ) : (
          <StudentTable 
            students={filteredStudents} 
            onView={(s) => navigate(`/admin/students/${s.id}`)}
            onEdit={(s) => navigate(`/admin/students/edit/${s.id}`)}
            onDelete={() => {
              if (window.confirm('Are you sure you want to delete this student?')) {
                // TODO: Implement delete functionality
                showNotification('Delete functionality coming soon', 'info');
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default Students;

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
import { useNotification } from '../../context/NotificationContext';
import type { Student, StudentFilters as IStudentFilters, FeeStatus } from '../../types/student';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { SkeletonTable } from '../../components/common/Skeleton';
import { Button } from '../../components/ui/button';

const Students: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { showNotification } = useNotification();

  const fetchStudents = useCallback(async (filters?: IStudentFilters) => {
    try {
      setLoading(true);
      const data = await studentService.getStudents(filters);
      
      // Enriched data for visual consistency
      const enrichedData = data.map(s => ({
        ...s,
        className: s.className || 'Grade 10',
        classSection: s.classSection || 'A',
        parentName: s.parentName || 'Parent Name',
        // TODO: Fetch real fee status from fees API when available
        // feeStatus: await feeService.getStudentFeeStatus(s.id)
        feeStatus: s.feeStatus || 'Pending' as FeeStatus
      }));
      
      setStudents(enrichedData);
    } catch {
      showNotification('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (name: string, value: string) => {
    fetchStudents({ [name]: value });
  };

  const handleReset = () => {
    setSearchTerm("");
    fetchStudents();
  };

  const filteredStudents = students.filter(s => 
    (s.fullName || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
    (s.parentName || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

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
          <StudentFilters onFilterChange={handleFilterChange} />
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
            onDelete={(_id) => {
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

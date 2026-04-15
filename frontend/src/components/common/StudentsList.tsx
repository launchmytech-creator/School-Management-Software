import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import StudentFilters from "../../components/Admin/StudentFilters";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  StudentClassGroup,
  TeacherStudentRow,
  AdminStudentRow,
  AccountantStudentRow,
} from "../../components/students";
import { AdminStatCard } from "../../components/dashboard";
import {
  Plus,
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useAuth } from "../../context/AuthContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useAllStudents } from "../../hooks/queries/useStudents";
import { useTeacherAllocations } from "../../hooks/queries/useTeachers";
import { useFeeTransactions } from "../../hooks/queries/useFeeTransactions";
import { useDeleteStudent } from "../../hooks/mutations";
import type { Student, FeeStatus } from "../../types/student";
import type { Class } from "../../types/class";

interface StudentsListProps {
  layout: "admin" | "accountant" | "teacher";
}

interface EnrichedStudent extends Student {
  totalDue?: number;
  totalPaid?: number;
  balance?: number;
  feeStatusLocal?: "paid" | "pending" | "partial";
}

interface ClassGroup {
  classId: string;
  className: string;
  classSection: string | null;
}

const StudentsList: React.FC<StudentsListProps> = ({ layout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();

  const isAdmin = layout === "admin";
  const isAccountant = layout === "accountant";
  const isTeacher = layout === "teacher";

  const teacherId = user?.id as number;
  
  const { data: allocations = [] } = useTeacherAllocations(
    teacherId,
    selectedYear?.id ? Number(selectedYear?.id) : undefined,
  );

  const teacherClassIds = useMemo(() => {
    return new Set<string>(allocations.map((a) => String(a.classId)));
  }, [allocations]);

  const { data: allClassesData = [] } = useClasses(selectedYear?.id);
  
  const classes = useMemo(() => {
    if (isTeacher) {
      return allClassesData.filter((c) => teacherClassIds.has(c.id));
    }
    return allClassesData;
  }, [allClassesData, isTeacher, teacherClassIds]);

  const { data: studentsData = [], isLoading: loadingStudents } = useAllStudents();
  const { data: feeTransactions = [] } = useFeeTransactions({
    academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined
  });
  
  const deleteStudent = useDeleteStudent();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [filters, setFilters] = useState({
    classId: "",
    academicYear: "",
    status: "",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    studentId: null as number | null,
  });

  const allStudents = useMemo(() => {
    if (isAdmin) {
      const feeStatusMap: Record<number, FeeStatus> = {};
      try {
        const byStudent = new Map<
          number,
          { total: number; paid: number; partial: number }
        >();
        for (const t of feeTransactions) {
          const existing = byStudent.get(t.studentId) || {
            total: 0,
            paid: 0,
            partial: 0,
          };
          existing.total += 1;
          if (t.status === "paid") existing.paid += 1;
          else if (t.status === "partial") existing.partial += 1;
          byStudent.set(t.studentId, existing);
        }
        for (const [studentId, counts] of byStudent) {
          if (counts.paid === counts.total) {
            feeStatusMap[studentId] = "Paid";
          } else if (counts.paid > 0 || counts.partial > 0) {
            feeStatusMap[studentId] = "Partial";
          } else {
            feeStatusMap[studentId] = "Pending";
          }
        }
      } catch {
        // Fee data unavailable
      }

      const enrichedData: EnrichedStudent[] = studentsData.map((s) => ({
        ...s,
        parentName: s.parentName || "—",
        feeStatus: feeStatusMap[s.id] || ("N/A" as FeeStatus),
      }));

      return enrichedData;
    } else if (isAccountant) {
      const byStudent = new Map<number, { totalDue: number; totalPaid: number }>();
      for (const t of feeTransactions) {
        const existing = byStudent.get(t.studentId) || {
          totalDue: 0,
          totalPaid: 0,
        };
        existing.totalDue += t.amountDue || 0;
        existing.totalPaid += t.amountPaid || 0;
        byStudent.set(t.studentId, existing);
      }

      const enrichedData: EnrichedStudent[] = studentsData.map((s) => {
        const feeData = byStudent.get(s.id) || { totalDue: 0, totalPaid: 0 };
        const balance = feeData.totalDue - feeData.totalPaid;
        let feeStatusLocal: "paid" | "pending" | "partial" = "pending";
        if (balance <= 0) feeStatusLocal = "paid";
        else if (feeData.totalPaid > 0) feeStatusLocal = "partial";

        return {
          ...s,
          parentName: s.parentName || "—",
          parentPhone: s.parentPhone || "",
          totalDue: feeData.totalDue,
          totalPaid: feeData.totalPaid,
          balance,
          feeStatusLocal,
        };
      });

      return enrichedData;
    } else {
      const enrichedData: EnrichedStudent[] = studentsData.map((s) => ({
        ...s,
        parentName: s.parentName || "—",
        parentPhone: s.parentPhone || "",
        totalDue: 0,
        totalPaid: 0,
        balance: 0,
        feeStatusLocal: "pending" as const,
      }));

      return enrichedData;
    }
  }, [studentsData, isAdmin, isAccountant, feeTransactions]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilters({ classId: "", academicYear: "", status: "" });
    setExpandedClasses(new Set());
  };

  const expandAll = () => {
    const allKeys = classes.map((c) => c.id.toString());
    setExpandedClasses(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedClasses(new Set());
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (filters.classId && c.id.toString() !== filters.classId) return false;
      return true;
    });
  }, [classes, filters.classId]);

  const classGroups = useMemo((): ClassGroup[] => {
    return filteredClasses
      .map((c) => ({
        classId: c.id.toString(),
        className: c.name || "Unassigned",
        classSection: c.section || null,
      }))
      .sort((a, b) => {
        const nameCompare = a.className.localeCompare(b.className);
        if (nameCompare !== 0) return nameCompare;
        return (a.classSection || "").localeCompare(b.classSection || "");
      });
  }, [filteredClasses]);

  const handleExpandClass = (classObj: Class) => {
    const classIdStr = String(classObj.id);
    setExpandedClasses((prev) => {
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
    const students = allStudents.filter(
      (s) => s.currentClassId?.toString() === classId,
    );

    return students
      .filter((s) => {
        if (filters.status && s.status !== filters.status) return false;
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const matchesName = s.fullName?.toLowerCase().includes(search);
          const matchesParent = s.parentName?.toLowerCase().includes(search);
          const matchesAdmission = s.admissionNumber
            ?.toLowerCase()
            .includes(search);
          if (!matchesName && !matchesParent && !matchesAdmission) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  const stats = useMemo(() => {
    return {
      totalClasses: classGroups.length,
      totalLoadedStudents: allStudents.length,
      paid: isAdmin
        ? allStudents.filter((s) => s.feeStatus === "Paid").length
        : allStudents.filter((s) => s.feeStatusLocal === "paid").length,
      partial: isAdmin
        ? allStudents.filter((s) => s.feeStatus === "Partial").length
        : allStudents.filter((s) => s.feeStatusLocal === "partial").length,
      pending: isAdmin
        ? allStudents.filter((s) => s.feeStatus === "Pending").length
        : allStudents.filter((s) => s.feeStatusLocal === "pending").length,
    };
  }, [allStudents, classGroups, isAdmin]);

  const matchingClassIds = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const search = searchTerm.toLowerCase();
    return classGroups
      .map((group) => group.classId)
      .filter((classId) => {
        const students = allStudents.filter(
          (s) =>
            s.currentClassId?.toString() === classId &&
            (s.fullName?.toLowerCase().includes(search) ||
              s.parentName?.toLowerCase().includes(search) ||
              s.admissionNumber?.toLowerCase().includes(search)),
        );
        return students.length > 0;
      });
  }, [searchTerm, allStudents, classGroups]);

  React.useEffect(() => {
    if (matchingClassIds.length > 0) {
      setExpandedClasses(new Set(matchingClassIds));
    }
  }, [matchingClassIds]);

  const basePath = isAdmin
    ? "/admin"
    : isAccountant
      ? "/accountant"
      : "/teacher";

  const handleDeleteStudent = async () => {
    if (!deleteDialog.studentId) return;
    try {
      await deleteStudent.mutateAsync(deleteDialog.studentId);
      setDeleteDialog({ isOpen: false, studentId: null });
    } catch {
      // Error handled by mutation hook
    }
  };

  const loading = loadingStudents;

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatCard
            label="Classes Assigned"
            value={stats.totalClasses}
            icon={Users}
          />
          <AdminStatCard
            label="Total Students"
            value={stats.totalLoadedStudents}
            icon={Users}
            variant="default"
          />
          <AdminStatCard
            label="Subject Allocations"
            value={allocations.length || 0}
            icon={BookOpen}
            variant="purple"
          />
        </div>
      )}

      {isAccountant && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AdminStatCard
            label="Total Classes"
            value={stats.totalClasses}
            icon={Users}
          />
          <AdminStatCard
            label="Fee Paid"
            value={stats.paid}
            icon={CheckCircle}
            variant="emerald"
          />
          <AdminStatCard
            label="Partial Payment"
            value={stats.partial}
            icon={Clock}
            variant="blue"
          />
          <AdminStatCard
            label="Pending"
            value={stats.pending}
            icon={AlertTriangle}
            variant="amber"
          />
          <AdminStatCard
            label="Students Loaded"
            value={stats.totalLoadedStudents}
            icon={Users}
            variant="default"
          />
        </div>
      )}

      {isAdmin && (
        <PageHeader
          title="Students"
          subtitle="Manage student enrollments, profiles and academic records"
          breadcrumb={{
            links: [
              { label: "People", href: `${basePath}/students` },
              { label: "Students", active: true },
            ],
          }}
          actions={[
            {
              label: "Add Student",
              icon: Plus,
              onClick: () => navigate(`${basePath}/add-student`),
            },
          ]}
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onReset={handleReset}
        searchPlaceholder={
          isAdmin
            ? "Search by name or parent..."
            : "Search by student, parent, or admission number..."
        }
      >
        {isAdmin ? (
          <StudentFilters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="gap-1.5"
            >
              <ChevronDown className="w-4 h-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="gap-1.5"
            >
              <ChevronRight className="w-4 h-4" />
              Collapse All
            </Button>
          </div>
        )}
      </FilterBar>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
            >
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
            const classObj = classes.find(
              (c) => c.id.toString() === group.classId,
            );
            const isExpanded = expandedClasses.has(group.classId);
            const students = getFilteredStudents(group.classId);

            return (
              <StudentClassGroup
                key={group.classId}
                className={group.className}
                classSection={group.classSection}
                students={students}
                isExpanded={isExpanded}
                isLoading={false}
                hasError={false}
                onToggle={() => classObj && handleExpandClass(classObj)}
              >
                {students.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="pl-10 pr-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        {isTeacher ? (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Parent Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Parent Phone
                            </th>
                            <th className=" pr-16 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Action
                            </th>
                          </>
                        ) : isAdmin ? (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Parent Name
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Fee Status
                            </th>
                            <th className="pl-6 pr-10 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Parent Name
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Total Due
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Paid
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) =>
                        isTeacher ? (
                          <TeacherStudentRow
                            key={student.id}
                            student={student}
                            navigate={navigate}
                            basePath={basePath}
                          />
                        ) : isAdmin ? (
                          <AdminStudentRow
                            key={student.id}
                            student={student}
                            navigate={navigate}
                            basePath={basePath}
                            onDelete={(id) => setDeleteDialog({ isOpen: true, studentId: id })}
                          />
                        ) : (
                          <AccountantStudentRow
                            key={student.id}
                            student={student}
                            navigate={navigate}
                            basePath={basePath}
                            onDelete={(id) => setDeleteDialog({ isOpen: true, studentId: id })}
                          />
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    {searchTerm || filters.status
                      ? "No students match your filters in this class"
                      : "No students in this class"}
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
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );

  return renderContent();
};

export default StudentsList;

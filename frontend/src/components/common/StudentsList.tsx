import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import StudentFilters from "../../components/Admin/StudentFilters";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { StudentClassGroup } from "../../components/students";
import StatusBadge from "../../components/common/StatusBadge";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { studentService } from "../../services/studentService";
import { classService } from "../../services/classService";
import { feeService } from "../../services/feeService";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import type { Student, FeeStatus } from "../../types/student";
import type { Class } from "../../types/class";

interface StudentsListProps {
  layout: "admin" | "accountant";
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
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const isAdmin = layout === "admin";

  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      console.log(data)
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [showNotification]);

  const fetchAllStudents = useCallback(async () => {
    if (!selectedYear?.id) {
      setAllStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const studentsData = await studentService.getStudents({
        academicYear: selectedYear.id,
      });

      if (isAdmin) {
        const feeStatusMap: Record<number, FeeStatus> = {};
        try {
          const transactions = await feeService.getFeeTransactions({
            academicYearId: parseInt(selectedYear.id),
          });
          const byStudent = new Map<
            number,
            { total: number; paid: number; partial: number }
          >();
          for (const t of transactions) {
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

        setAllStudents(enrichedData);
      } else {
        const enrichedData: EnrichedStudent[] = await Promise.all(
          studentsData.map(async (s) => {
            try {
              const transactions = await feeService.getStudentFeeTransactions(s.id);
              const totalDue = transactions.reduce(
                (sum, t) => sum + (t.amountDue || 0),
                0,
              );
              const totalPaid = transactions.reduce(
                (sum, t) => sum + (t.amountPaid || 0),
                0,
              );
              const balance = totalDue - totalPaid;

              let feeStatusLocal: "paid" | "pending" | "partial" = "pending";
              if (balance <= 0) feeStatusLocal = "paid";
              else if (totalPaid > 0) feeStatusLocal = "partial";

              return {
                ...s,
                parentName: s.parentName || "—",
                parentPhone: s.parentPhone || "",
                totalDue,
                totalPaid,
                balance,
                feeStatusLocal,
              };
            } catch {
              return {
                ...s,
                parentName: s.parentName || "—",
                totalDue: 0,
                totalPaid: 0,
                balance: 0,
                feeStatusLocal: "pending" as const,
              };
            }
          }),
        );

        setAllStudents(enrichedData);
      }
    } catch {
      showNotification("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, isAdmin, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedYear?.id) {
      fetchAllStudents();
    }
  }, [selectedYear, fetchAllStudents]);

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
    const students = allStudents.filter((s) => s.currentClassId?.toString() === classId);

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
      .map(group => group.classId)
      .filter(classId => {
        const students = allStudents.filter(s => 
          s.currentClassId?.toString() === classId &&
          (s.fullName?.toLowerCase().includes(search) ||
           s.parentName?.toLowerCase().includes(search) ||
           s.admissionNumber?.toLowerCase().includes(search))
        );
        return students.length > 0;
      });
  }, [searchTerm, allStudents, classGroups]);

  useEffect(() => {
    if (matchingClassIds.length > 0) {
      setExpandedClasses(new Set(matchingClassIds));
    }
  }, [matchingClassIds]);

  const getFeeStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "danger";
      case "Partial":
        return "warning";
      default:
        return "neutral";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "partial":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Pending
          </span>
        );
      default:
        return null;
    }
  };

  const basePath = isAdmin ? "/admin" : "/accountant";

  const renderStudentRow = (student: EnrichedStudent) => {
    if (isAdmin) {
      return (
        <tr
          key={student.id}
          className="hover:bg-slate-50/50 transition-colors group"
        >
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
                <span className="font-semibold text-slate-900 block">
                  {student.fullName}
                </span>
                <span className="text-xs text-slate-400">
                  ID: STU-{student.id.toString().padStart(4, "0")}
                </span>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-slate-600">
            {student.parentName}
          </td>
          <td className="px-6 py-4 text-center">
            <StatusBadge
              label={student.feeStatus || "N/A"}
              variant={getFeeStatusVariant(student.feeStatus || "")}
            />
          </td>
          <td className="pl-6 pr-10 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => navigate(`${basePath}/students/${student.id}`)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Eye className="size-4" />
              </button>
              <button
                onClick={() =>
                  navigate(`${basePath}/students/${student.id}/edit`)
                }
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <Edit2 className="size-4" />
              </button>
              <button
                onClick={() =>
                  setDeleteDialog({ isOpen: true, studentId: student.id })
                }
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    } else {
      return (
        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {student.fullName?.charAt(0) || "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {student.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {student.admissionNumber}
                </p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-slate-600">{student.parentName}</div>
            {student.parentPhone && (
              <div className="text-xs text-slate-400">
                {student.parentPhone}
              </div>
            )}
          </td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
            {formatCurrency(student.totalDue || 0)}
          </td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
            {formatCurrency(student.totalPaid || 0)}
          </td>
          <td className="px-6 py-4 text-right">
            <span
              className={`text-sm font-bold ${
                (student.balance || 0) > 0
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              {formatCurrency(student.balance || 0)}
            </span>
          </td>
          <td className="px-6 py-4 text-center">
            {getStatusBadge(student.feeStatusLocal || "pending")}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => navigate(`${basePath}/students/${student.id}`)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Eye className="size-4" />
              </button>
              <button
                onClick={() =>
                  navigate(`${basePath}/students/${student.id}/edit`)
                }
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <Edit2 className="size-4" />
              </button>
              <button
                onClick={() =>
                  setDeleteDialog({ isOpen: true, studentId: student.id })
                }
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteDialog.studentId) return;
    try {
      await studentService.deleteStudent(deleteDialog.studentId);
      showNotification("Student deleted successfully!", "success");
      setClassStudents((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = next[key].filter((s) => s.id !== deleteDialog.studentId);
        });
        return next;
      });
    } catch {
      showNotification("Failed to delete student", "error");
    }
    setDeleteDialog({ isOpen: false, studentId: null });
  };

  const renderContent = () => (
    <div className="space-y-6 pb-12">
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalClasses}
                </p>
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
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.paid}
                </p>
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
                <p className="text-2xl font-bold text-blue-700">
                  {stats.partial}
                </p>
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
                <p className="text-2xl font-bold text-amber-700">
                  {stats.pending}
                </p>
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
                <p className="text-2xl font-bold text-slate-700">
                  {stats.totalLoadedStudents}
                </p>
                <p className="text-sm text-slate-500">Students Loaded</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
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
              onClick: () => navigate(`${basePath}/add-student`)
            }
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
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Parent Name
                        </th>
                        {isAdmin ? (
                          <>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Fee Status
                            </th>
                            <th className="pl-6 pr-10 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </>
                        ) : (
                          <>
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
                      {students.map(renderStudentRow)}
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

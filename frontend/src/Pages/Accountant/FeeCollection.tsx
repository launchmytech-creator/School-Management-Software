import React, { useState, useEffect, useCallback, useMemo } from "react";
import AccountantLayout from "../../layouts/AccountantLayout";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  feeService,
  type FeeTransaction,
  type RecordPaymentDto,
} from "../../services/feeService";
import { classService } from "../../services/classService";
import type { Class } from "../../types/class";
import {
  FeeStatsCards,
  FeeFilters,
  FeePaymentModal,
  FeeCollectionTable,
} from "../../components/fee";

interface TermGroup {
  id: string;
  termNumber: number | null;
  termLabel: string;
  dueDate: string;
  transactions: FeeTransaction[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  status: "paid" | "pending" | "partial";
}

interface StudentGroup {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  terms: TermGroup[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  termsCount: number;
  paidTerms: number;
}

const AccountantFeeCollection: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(
    new Set(),
  );
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermGroup | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses(selectedYear?.id);
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [selectedYear, showNotification]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feeService.getFeeTransactions({
        classId: selectedClass ? parseInt(selectedClass) : undefined,
        academicYearId: selectedYear?.id
          ? parseInt(selectedYear.id)
          : undefined,
      });
      setTransactions(data);
    } catch {
      showNotification("Failed to fetch fee transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedYear, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const groupedByStudent = useMemo(() => {
    const studentMap = new Map<number, StudentGroup>();

    transactions.forEach((tx) => {
      const termLabel = tx.termNumber ? `Term ${tx.termNumber}` : "Yearly";
      const termId = `${tx.studentId}-${tx.termNumber ?? "yearly"}`;

      if (!studentMap.has(tx.studentId)) {
        studentMap.set(tx.studentId, {
          studentId: tx.studentId,
          studentName: tx.studentName,
          admissionNumber: tx.admissionNumber,
          className: tx.className,
          terms: [],
          totalAmountDue: 0,
          totalAmountPaid: 0,
          totalAmountPending: 0,
          termsCount: 0,
          paidTerms: 0,
        });
      }

      const student = studentMap.get(tx.studentId)!;
      let termGroup = student.terms.find((t) => t.id === termId);

      if (!termGroup) {
        termGroup = {
          id: termId,
          termNumber: tx.termNumber,
          termLabel,
          dueDate: tx.dueDate,
          transactions: [],
          totalAmountDue: 0,
          totalAmountPaid: 0,
          totalAmountPending: 0,
          status: "pending",
        };
        student.terms.push(termGroup);
      }

      termGroup.transactions.push(tx);
      termGroup.totalAmountDue += tx.amountDue;
      termGroup.totalAmountPaid += tx.amountPaid;
      termGroup.totalAmountPending += tx.amountPending;

      if (termGroup.transactions.length === 1) {
        termGroup.status = tx.status as "paid" | "pending" | "partial";
      } else {
        const allPaid = termGroup.transactions.every(
          (t) => t.status === "paid",
        );
        const anyPending = termGroup.transactions.some(
          (t) => t.status === "pending",
        );
        const anyPartial = termGroup.transactions.some(
          (t) => t.status === "partial",
        );

        if (allPaid) {
          termGroup.status = "paid";
        } else if (
          anyPartial ||
          (anyPending && termGroup.status !== "partial")
        ) {
          termGroup.status = "partial";
        } else {
          termGroup.status = "pending";
        }
      }
    });

    studentMap.forEach((student) => {
      student.terms.sort((a, b) => {
        if (a.termNumber === null) return 1;
        if (b.termNumber === null) return -1;
        return a.termNumber - b.termNumber;
      });

      student.terms.forEach((term) => {
        student.totalAmountDue += term.totalAmountDue;
        student.totalAmountPaid += term.totalAmountPaid;
        student.totalAmountPending += term.totalAmountPending;
        if (term.status === "paid") student.paidTerms++;
      });
      student.termsCount = student.terms.length;
    });

    return Array.from(studentMap.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );
  }, [transactions]);

  const filteredStudents = useMemo(() => {
    return groupedByStudent.filter((s) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        s.studentName.toLowerCase().includes(searchLower) ||
        s.admissionNumber.toLowerCase().includes(searchLower);

      let matchesStatus = true;
      if (statusFilter === "paid") {
        matchesStatus = s.totalAmountPending === 0;
      } else if (statusFilter === "pending") {
        matchesStatus = s.terms.some(
          (t) => t.status === "pending" || t.status === "partial",
        );
      } else if (statusFilter === "partial") {
        matchesStatus = s.terms.some((t) => t.status === "partial");
      }

      return matchesSearch && matchesStatus;
    });
  }, [groupedByStudent, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      totalStudents: filteredStudents.length,
      fullyPaid: filteredStudents.filter((s) => s.totalAmountPending === 0)
        .length,
      withPending: filteredStudents.filter((s) =>
        s.terms.some((t) => t.status === "pending"),
      ).length,
      withPartial: filteredStudents.filter((s) =>
        s.terms.some((t) => t.status === "partial"),
      ).length,
      totalPendingAmount: filteredStudents.reduce(
        (sum, s) => sum + s.totalAmountPending,
        0,
      ),
    }),
    [filteredStudents],
  );

  const toggleStudent = (studentId: number) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  };

  const openPaymentModal = (term: TermGroup) => {
    setSelectedTerm(term);
    setShowPaymentModal(true);
  };

  const handlePayment = async (data: RecordPaymentDto) => {
    if (!selectedTerm) return;

    try {
      const term = selectedTerm;

      for (const tx of term.transactions) {
        if (tx.amountPending > 0 && (data.amountPaid ?? 0) > 0) {
          await feeService.recordPayment(tx.id, {
            ...data,
            amountPaid: Math.min(tx.amountPending, data.amountPaid ?? 0),
          });
        }
      }

      showNotification("Payment recorded successfully", "success");
      setShowPaymentModal(false);
      setSelectedTerm(null);
      setExpandedTerms(new Set());
      fetchTransactions();
    } catch {
      showNotification("Failed to record payment", "error");
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSelectedClass("");
    setExpandedStudents(new Set());
    setExpandedTerms(new Set());
  };

  return (
    <AccountantLayout title="Fee Collection" subtitle="Manage fee payments and track transactions">
      <div className="space-y-6 pb-12">
        {/* <PageHeader 
          title="Fee Collection"
          subtitle="Manage fee payments and track transactions"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/accountant/dashboard" },
              { label: "Fee Collection", active: true }
            ]
          }}
        /> */}

        <FeeStatsCards {...stats} />

        <FeeFilters
          classes={classes}
          selectedClass={selectedClass}
          onClassChange={(id) => {
            setSelectedClass(id);
            setStatusFilter("");
            setSearchTerm("");
            setExpandedStudents(new Set());
            setExpandedTerms(new Set());
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={handleReset}
        />

        {selectedClass ? (
          <FeeCollectionTable
            students={filteredStudents}
            expandedStudents={expandedStudents}
            expandedTerms={expandedTerms}
            onToggleStudent={toggleStudent}
            onToggleTerm={toggleTerm}
            onCollect={openPaymentModal}
            onWaive={() => {}}
            canApplyWaiver={false}
            loading={loading}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">
              Please select a class to view fee transactions
            </p>
          </div>
        )}

        <FeePaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTerm(null);
          }}
          term={selectedTerm}
          onSubmit={handlePayment}
        />
      </div>
    </AccountantLayout>
  );
};

export default AccountantFeeCollection;

import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  FileText,
  Wallet,
  Percent,
  Pencil,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../ui/button";
import EmptyState from "../common/EmptyState";
import type { FeeTransaction } from "../../services/feeService";
import { getStatusBadge } from "../common/StatusBadge";

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
  academicYearName: string;
  terms: TermGroup[];
  totalAmountDue: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  termsCount: number;
  paidTerms: number;
}

interface FeeCollectionTableProps {
  students: StudentGroup[];
  expandedStudents: Set<number>;
  expandedTerms: Set<string>;
  onToggleStudent: (id: number) => void;
  onToggleTerm: (id: string) => void;
  onCollect: (term: TermGroup) => void;
  onWaive: (transaction: FeeTransaction, termLabel: string) => void;
  onEdit: (transaction: FeeTransaction) => void;
  onViewReceipt: (transaction: FeeTransaction, studentName: string, academicYearName: string) => void;
  canApplyWaiver: boolean;
  canEdit: boolean;
  loading?: boolean;
}

export const FeeCollectionTable: React.FC<FeeCollectionTableProps> = ({
  students,
  expandedStudents,
  expandedTerms,
  onToggleStudent,
  onToggleTerm,
  onCollect,
  onWaive,
  onEdit,
  onViewReceipt,
  canApplyWaiver,
  canEdit,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No students found"
        description="No fee transactions for this class yet"
      />
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const isStudentExpanded = expandedStudents.has(student.studentId);

        return (
          <div
            key={student.studentId}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Student Row */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onToggleStudent(student.studentId)}
            >
              <div className="flex items-center gap-4">
                {isStudentExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {student.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {student.admissionNumber}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  {student.className}
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  {student.paidTerms}/{student.termsCount} Terms
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCurrency(student.totalAmountDue)}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(student.totalAmountPaid)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="text-sm font-semibold text-rose-600">
                    {formatCurrency(student.totalAmountPending)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Terms View */}
            {isStudentExpanded && (
              <div className="border-t border-slate-200 bg-slate-50">
                <div className="px-6 py-3 bg-white border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Term-wise Fee Details
                  </p>
                </div>
                <div className="divide-y divide-slate-200">
                  {student.terms.map((term) => {
                    const isTermExpanded = expandedTerms.has(term.id);

                    return (
                      <div key={term.id}>
                        {/* Term Row */}
                        <div
                          className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTerm(term.id);
                          }}
                        >
                          <div className="flex items-center gap-3 pl-4">
                            {isTermExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-700">
                                {term.termLabel}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              Due:{" "}
                              {term.dueDate
                                ? new Date(term.dueDate).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                Term Total
                              </p>
                              <p className="text-sm font-semibold text-slate-700">
                                {formatCurrency(term.totalAmountDue)}
                              </p>
                            </div>
                            <div className="text-right hidden md:block">
                              <p className="text-xs text-slate-500">Paid</p>
                              <p className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(term.totalAmountPaid)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Pending</p>
                              <p className="text-sm font-semibold text-rose-600">
                                {formatCurrency(term.totalAmountPending)}
                              </p>
                            </div>
                            {getStatusBadge(term.status)}

                            {term.status !== "paid" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCollect(term);
                                }}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                Collect
                              </Button>
                            )}

                            {canEdit && term.status !== "paid" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (term.transactions.length > 0) {
                                    onEdit(term.transactions[0]);
                                  }
                                }}
                                className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Due Date"
                              >
                                <Pencil className="w-4 h-4 text-blue-500" />
                              </button>
                            )}

                            {term.status === "paid" && term.transactions[0]?.receiptNumber && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (term.transactions.length > 0) {
                                    onViewReceipt(term.transactions[0], student.studentName, student.academicYearName);
                                  }
                                }}
                                className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                                title="View Receipt"
                              >
                                <Receipt className="w-4 h-4 text-blue-500" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTerm(term.id);
                              }}
                              className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                              title="View breakdown"
                            >
                              <FileText className="w-4 h-4 text-slate-500" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Fee Breakdown */}
                        {isTermExpanded && (
                          <div className="bg-white border-t border-slate-200">
                            <table className="w-full">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="px-8 py-2 text-left text-xs font-bold text-slate-500 uppercase">
                                    Fee Type
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">
                                    Due
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">
                                    Paid
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">
                                    Pending
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {term.transactions.map((tx) => (
                                  <React.Fragment key={tx.id}>
                                    {/* Main Transaction Row */}
                                    <tr className="bg-slate-50/70 hover:bg-slate-100/50">
                                      <td className="px-8 py-3">
                                        <span className="text-sm font-semibold text-slate-800">
                                          Combined
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                        {formatCurrency(tx.amountDue)}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                                        {formatCurrency(tx.amountPaid)}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-semibold text-rose-600">
                                        {formatCurrency(tx.amountPending)}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {getStatusBadge(
                                          tx.status as
                                            | "paid"
                                            | "pending"
                                            | "partial",
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {canEdit && tx.status !== "paid" && (
                                            <button
                                              onClick={() => onEdit(tx)}
                                              className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                                              title="Edit Due Date"
                                            >
                                              <Pencil className="w-4 h-4 text-blue-500" />
                                            </button>
                                          )}
                                          {tx.status !== "paid" &&
                                            canApplyWaiver && (
                                              <button
                                                onClick={() =>
                                                  onWaive(tx, term.termLabel)
                                                }
                                                className="p-1.5 hover:bg-amber-50 rounded transition-colors"
                                                title="Apply Waiver"
                                              >
                                                <Percent className="w-4 h-4 text-amber-500" />
                                              </button>
                                            )}
                                        </div>
                                      </td>
                                    </tr>
                                    {/* Fee Breakdown Sub-Rows */}
                                    {tx.feeBreakdown && Object.entries(tx.feeBreakdown).length > 0 ? (
                                      Object.entries(tx.feeBreakdown).map(([feeName, componentAmount], index) => {
                                        const isPaid = tx.status === 'paid';
                                        const isPending = tx.status === 'pending';
                                        
                                        // Calculate proportional amounts for partial payments
                                        const ratio = tx.amountDue > 0 
                                          ? (tx.amountPaid / tx.amountDue) 
                                          : 0;
                                        
                                        const paidAmount = isPending ? 0 : componentAmount * ratio;
                                        const pendingAmount = isPaid ? 0 : componentAmount - paidAmount;
                                        
                                        return (
                                          <tr
                                            key={`${tx.id}-${feeName}-${index}`}
                                            className="hover:bg-slate-50/50 border-b border-slate-100"
                                          >
                                            <td className="px-12 py-2 text-sm text-slate-600 flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                              <span className="capitalize">{feeName.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-slate-700">
                                              {formatCurrency(componentAmount)}
                                            </td>
                                            <td className={`px-4 py-2 text-sm text-right ${paidAmount > 0 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                                              {paidAmount > 0 ? formatCurrency(paidAmount) : '—'}
                                            </td>
                                            <td className={`px-4 py-2 text-sm text-right ${pendingAmount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                                              {pendingAmount > 0 ? formatCurrency(pendingAmount) : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                            <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr className="hover:bg-slate-50/50 border-b border-slate-100">
                                        <td className="px-12 py-2 text-sm text-slate-500 italic">
                                          No breakdown available
                                        </td>
                                        <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                        <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                        <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                        <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                        <td className="px-4 py-2 text-sm text-slate-400 text-center">—</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FeeCollectionTable;

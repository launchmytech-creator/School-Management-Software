import React from "react";
import { useNavigate } from "react-router-dom";
import { getStatusBadge } from "../common/StatusBadge";
import StudentRowActions from "./StudentRowActions";
import { formatCurrency } from "../../lib/utils";

interface EnrichedStudent {
  id: number;
  fullName?: string;
  admissionNumber?: string;
  parentName?: string;
  parentPhone?: string;
  totalDue?: number;
  totalPaid?: number;
  balance?: number;
  feeStatusLocal?: "paid" | "pending" | "partial";
}

interface AccountantStudentRowProps {
  student: EnrichedStudent;
  navigate: ReturnType<typeof useNavigate>;
  basePath: string;
  onDelete: (id: number) => void;
}

const AccountantStudentRow: React.FC<AccountantStudentRowProps> = ({
  student,
  navigate,
  basePath,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
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
        <StudentRowActions
          studentId={student.id}
          onView={(id) => navigate(`${basePath}/students/${id}`)}
          onEdit={(id) => navigate(`${basePath}/students/${id}/edit`)}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
};

export default AccountantStudentRow;

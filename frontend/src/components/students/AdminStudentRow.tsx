import React from "react";
import { useNavigate } from "react-router-dom";
import StudentAvatar from "./StudentAvatar";
import StudentRowActions from "./StudentRowActions";
import StatusBadge from "../common/StatusBadge";
import type { FeeStatus } from "../../types/student";

interface EnrichedStudent {
  id: number;
  fullName?: string;
  parentName?: string;
  feeStatus?: FeeStatus;
}

interface AdminStudentRowProps {
  student: EnrichedStudent;
  navigate: ReturnType<typeof useNavigate>;
  basePath: string;
  onDelete: (id: number) => void;
}

const AdminStudentRow: React.FC<AdminStudentRowProps> = ({
  student,
  navigate,
  basePath,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="pl-10 pr-6 py-4">
        <div className="flex items-center gap-4">
          <StudentAvatar
            studentId={student.id}
            studentName={student.fullName}
            showHoverScale
          />
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
        <StatusBadge status={student.feeStatus || "N/A"} />
      </td>
      <td className="pl-6 pr-10 py-4">
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

export default AdminStudentRow;

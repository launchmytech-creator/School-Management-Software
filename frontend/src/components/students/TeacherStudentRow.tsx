import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import StudentAvatar from "./StudentAvatar";

interface EnrichedStudent {
  id: number;
  fullName?: string;
  admissionNumber?: string;
  rollNumber?: string | null;
  parentName?: string;
  parentPhone?: string;
}

interface TeacherStudentRowProps {
  student: EnrichedStudent;
  navigate: ReturnType<typeof useNavigate>;
  basePath: string;
}

const TeacherStudentRow: React.FC<TeacherStudentRowProps> = ({
  student,
  navigate,
  basePath,
}) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="pl-10 pr-6 py-4">
        <div className="flex items-center gap-4">
          <StudentAvatar
            studentId={student.id}
            studentName={student.fullName}
          />
          <div>
            <span className="font-semibold text-slate-900 block">
              {student.fullName}
            </span>
            <span className="text-xs text-slate-400">
              ADM: {student.admissionNumber}
              {student.rollNumber && ` | Roll: ${student.rollNumber}`}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {student.parentName || "—"}
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {student.parentPhone || "—"}
      </td>
      <td className="py-4">
        <button
          onClick={() => navigate(`${basePath}/students/${student.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Profile
        </button>
      </td>
    </tr>
  );
};

export default TeacherStudentRow;

import React from "react";
import { Eye, Edit2, Trash2 } from "lucide-react";

interface StudentRowActionsProps {
  studentId: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const StudentRowActions: React.FC<StudentRowActionsProps> = ({
  studentId,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => onView(studentId)}
        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
      >
        <Eye className="size-4" />
      </button>
      <button
        onClick={() => onEdit(studentId)}
        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
      >
        <Edit2 className="size-4" />
      </button>
      <button
        onClick={() => onDelete(studentId)}
        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
};

export default StudentRowActions;

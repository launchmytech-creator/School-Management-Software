import React, { memo, useCallback } from "react";
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
  const handleView = useCallback(() => {
    onView(studentId);
  }, [onView, studentId]);

  const handleEdit = useCallback(() => {
    onEdit(studentId);
  }, [onEdit, studentId]);

  const handleDelete = useCallback(() => {
    onDelete(studentId);
  }, [onDelete, studentId]);

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleView}
        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
        title="View student"
      >
        <Eye className="size-4" />
      </button>
      <button
        onClick={handleEdit}
        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
        title="Edit student"
      >
        <Edit2 className="size-4" />
      </button>
      <button
        onClick={handleDelete}
        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
        title="Delete student"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
};

export default memo(StudentRowActions);

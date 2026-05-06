import React from "react";
import { BaseModal } from "./BaseModal";
import { Button } from "../ui/button";
import { Save } from "lucide-react";

interface StudentMarks {
  studentId: number;
  studentName: string;
  marksObtained: string;
  isAbsent: boolean;
}

interface MarksConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentMarks: StudentMarks[];
  loading: boolean;
}

export const MarksConfirmModal: React.FC<MarksConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentMarks,
  loading,
}) => {
  const totalStudents = studentMarks.length;
  const marksEntered = studentMarks.filter((s) => s.marksObtained && !s.isAbsent).length;
  const markedAbsent = studentMarks.filter((s) => s.isAbsent).length;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Confirm Save Marks" size="md">
      <div className="p-6 space-y-4">
        <p className="text-slate-600">
          Are you sure you want to save marks for{" "}
          <span className="font-semibold">{marksEntered + markedAbsent}</span> student(s)?
        </p>
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Students:</span>
            <span className="font-medium">{totalStudents}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Marks Entered:</span>
            <span className="font-medium text-emerald-600">{marksEntered}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Marked Absent:</span>
            <span className="font-medium text-red-600">{markedAbsent}</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            Save Marks
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

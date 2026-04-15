import React from "react";
import { XCircle } from "lucide-react";
import type { ExamSubjectResult } from "../../services/examResultService";

interface StudentMarks {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: string | null;
  marksObtained: string;
  isAbsent: boolean;
  existingResult?: ExamSubjectResult;
}

interface MarksRowProps {
  student: StudentMarks;
  maxMarks: number;
  onMarksChange: (studentId: number, value: string) => void;
  onAbsentToggle: (studentId: number) => void;
}

export const MarksRow: React.FC<MarksRowProps> = ({
  student,
  maxMarks,
  onMarksChange,
  onAbsentToggle,
}) => {
  const marks = parseFloat(student.marksObtained) || 0;
  const grade = student.isAbsent
    ? "AB"
    : marks >= maxMarks * 0.9
    ? "A+"
    : marks >= maxMarks * 0.8
    ? "A"
    : marks >= maxMarks * 0.7
    ? "B+"
    : marks >= maxMarks * 0.6
    ? "B"
    : marks >= maxMarks * 0.5
    ? "C"
    : marks >= maxMarks * 0.4
    ? "D"
    : "F";
  const hasExisting = !!student.existingResult;

  return (
    <tr key={student.studentId} className="hover:bg-slate-50/50">
      <td className="px-6 py-4 text-sm font-medium text-slate-700">
        {student.rollNumber || "-"}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
        {student.studentName}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
        {student.admissionNumber}
      </td>
      <td className="px-6 py-4 text-center">
        <input
          type="number"
          min="0"
          max={maxMarks}
          value={student.marksObtained}
          onChange={(e) => onMarksChange(student.studentId, e.target.value)}
          disabled={student.isAbsent}
          className={`w-20 px-3 py-1.5 border rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            student.isAbsent
              ? "bg-slate-100 border-slate-200 text-slate-400"
              : "border-slate-200"
          }`}
          placeholder="0"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            student.isAbsent
              ? "bg-red-100 text-red-700"
              : grade.includes("A")
              ? "bg-emerald-100 text-emerald-700"
              : grade.includes("B")
              ? "bg-blue-100 text-blue-700"
              : grade.includes("C")
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {grade}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onAbsentToggle(student.studentId)}
          className={`p-2 rounded-lg transition-colors ${
            student.isAbsent
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
        >
          {student.isAbsent ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <span className="text-xs font-medium">AB</span>
          )}
        </button>
      </td>
      <td className="px-6 py-4 text-center">
        {hasExisting ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Saved
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </td>
    </tr>
  );
};

import React, { memo, useCallback } from "react";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { type Student } from "../../types/student";
import EmptyState from "./EmptyState";
import { Button } from "../ui/button";

type AttendanceStatus = "present" | "absent";

interface AttendanceTableProps {
  students: Student[];
  attendanceRecords: Map<number, AttendanceStatus>;
  hasChanges: boolean;
  isDateInFuture: boolean;
  existingAttendanceCount: number;
  isPending: boolean;
  onStatusChange: (studentId: number, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onConfirm: () => void;
}

interface AttendanceRowProps {
  student: Student;
  currentStatus: AttendanceStatus;
  onStatusChange: (studentId: number, status: AttendanceStatus) => void;
}

const StatusIcon = memo(({ status }: { status: AttendanceStatus }) => {
  switch (status) {
    case "present":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "absent":
      return <XCircle className="w-4 h-4 text-rose-500" />;
    default:
      return null;
  }
});
StatusIcon.displayName = "StatusIcon";

const AttendanceRow = memo<AttendanceRowProps>(({ student, currentStatus, onStatusChange }) => {
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "??";
  };

  const handlePresentClick = useCallback(() => {
    onStatusChange(student.id, "present");
  }, [onStatusChange, student.id]);

  const handleAbsentClick = useCallback(() => {
    onStatusChange(student.id, "absent");
  }, [onStatusChange, student.id]);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-600">
          {student.rollNumber || "-"}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
            {getInitials(student.fullName)}
          </div>
          <span className="text-sm font-medium text-slate-900">
            {student.fullName}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentStatus === "present"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          <StatusIcon status={currentStatus} />
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePresentClick}
            className={`p-2 rounded-lg transition-colors ${
              currentStatus === "present"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-slate-100 text-slate-400"
            }`}
            title="Mark Present"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleAbsentClick}
            className={`p-2 rounded-lg transition-colors ${
              currentStatus === "absent"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-slate-100 text-slate-400"
            }`}
            title="Mark Absent"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});
AttendanceRow.displayName = "AttendanceRow";

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  attendanceRecords,
  hasChanges,
  isDateInFuture,
  existingAttendanceCount,
  isPending,
  onStatusChange,
  onMarkAllPresent,
  onConfirm,
}) => {
  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students found"
        description="There are no students in the selected class. Please select a class with students."
        className="py-16"
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Roll No.
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quick Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <AttendanceRow
                key={student.id}
                student={student}
                currentStatus={attendanceRecords.get(student.id) || "present"}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onMarkAllPresent}
          disabled={!hasChanges}
        >
          Reset to All Present
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!hasChanges || isDateInFuture || isPending}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {existingAttendanceCount > 0 ? "Update Attendance" : "Mark Attendance"}
        </Button>
      </div>
    </div>
  );
};
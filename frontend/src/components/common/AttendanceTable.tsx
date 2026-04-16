import React from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { type Student } from "../../types/student";

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
  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

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
            {students.map((student) => {
              const currentStatus = attendanceRecords.get(student.id) || "present";
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">
                      {student.rollNumber || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                        {student.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
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
                      {getStatusIcon(currentStatus)}
                      {currentStatus.charAt(0).toUpperCase() +
                        currentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {(["present", "absent"] as AttendanceStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => onStatusChange(student.id, status)}
                          className={`p-2 rounded-lg transition-colors ${
                            currentStatus === status
                              ? "bg-blue-100 text-blue-600"
                              : "hover:bg-slate-100 text-slate-400"
                          }`}
                          title={
                            status.charAt(0).toUpperCase() + status.slice(1)
                          }
                        >
                          {status === "present" && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {status === "absent" && (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onMarkAllPresent}
          className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          disabled={!hasChanges}
        >
          Reset to All Present
        </button>
        <button
          onClick={onConfirm}
          disabled={!hasChanges || isDateInFuture || isPending}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
            hasChanges && !isDateInFuture
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {existingAttendanceCount > 0 ? "Update Attendance" : "Mark Attendance"}
        </button>
      </div>
    </div>
  );
};

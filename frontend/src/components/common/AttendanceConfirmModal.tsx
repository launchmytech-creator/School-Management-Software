import React from "react";
import { BaseModal } from "./BaseModal";
import { Loader2 } from "lucide-react";

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
}

interface AttendanceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: string;
  currentClassName?: string;
  stats: AttendanceStats;
  existingAttendanceCount: number;
  isPending: boolean;
}

export const AttendanceConfirmModal: React.FC<AttendanceConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  currentClassName,
  stats,
  existingAttendanceCount,
  isPending,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Confirm Attendance" size="md">
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600">
          You are about to mark attendance for{" "}
          <span className="font-semibold">{formatDate(selectedDate)}</span> in{" "}
          <span className="font-semibold">{currentClassName}</span>.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Students:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Present:</span>
            <span className="font-semibold text-emerald-700">{stats.present}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-rose-600">Absent:</span>
            <span className="font-semibold text-rose-700">{stats.absent}</span>
          </div>
        </div>

        {existingAttendanceCount > 0 && (
          <p className="text-sm text-amber-600">
            This will update the existing attendance record.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

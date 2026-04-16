import React from "react";
import { Mail, Phone, Users } from "lucide-react";
import ProfileInfoRow from "../common/ProfileInfoRow";
import type { Student } from "../../types/student";

interface StudentProfileCardProps {
  student: Student | null;
  currentAcademicYearName: string;
  isAdmin: boolean;
  isTeacher: boolean;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  activatePending: boolean;
  deactivatePending: boolean;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  student,
  currentAcademicYearName,
  isAdmin,
  isTeacher,
  onEdit,
  onActivate,
  onDeactivate,
  activatePending,
  deactivatePending,
}) => {
  const isInactive = student?.status === "inactive";

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />

      <div className="relative inline-block mb-6">
        <div className="size-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.fullName}`}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className={`absolute bottom-1 right-1 size-6 border-4 border-white rounded-full ${
            isInactive ? "bg-rose-400" : "bg-emerald-500"
          }`}
        />
      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        {student?.fullName}
      </h2>
      {isInactive && (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider mb-2">
          Inactive
        </div>
      )}
      <div className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-500 text-[11px] font-black rounded-full uppercase tracking-widest mb-2">
        {student?.className}
      </div>
      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">
        Academic Year: {currentAcademicYearName || "N/A"}
      </p>

      <div className="space-y-4 text-left border-t border-slate-50 pt-8">
        <ProfileInfoRow
          icon={Users}
          label="Parent"
          value={student?.parentName ?? "N/A"}
        />
        <ProfileInfoRow
          icon={Phone}
          label="Phone"
          value={student?.phone ?? "N/A"}
        />
        <ProfileInfoRow
          icon={Mail}
          label="Email"
          value={<>{student?.phone?.replace(/\D/g, "")}@email.com</>}
        />
      </div>

      <div className="mt-10 space-y-3">
        {!isTeacher && (
          <button
            onClick={onEdit}
            className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            Edit Profile
          </button>
        )}
        {isAdmin && (
          <>
            {isInactive ? (
              <button
                onClick={onActivate}
                disabled={activatePending}
                className="w-full py-3.5 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-black text-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatePending ? "Activating..." : "Activate Student"}
              </button>
            ) : (
              <button
                onClick={onDeactivate}
                disabled={deactivatePending}
                className="w-full py-3.5 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deactivate Student
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

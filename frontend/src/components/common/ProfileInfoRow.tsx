import React from "react";
import type { LucideIcon } from "lucide-react";

interface ProfileInfoRowProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  truncate?: boolean;
}

const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({
  icon: Icon,
  label,
  value,
  truncate = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          {label}
        </p>
        <p
          className={`text-sm font-bold text-slate-700 ${
            truncate ? "truncate" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default ProfileInfoRow;

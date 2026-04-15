import React from "react";

interface StudentAvatarProps {
  studentId: number;
  studentName?: string;
  showHoverScale?: boolean;
  variant?: "rounded" | "circle";
}

const StudentAvatar: React.FC<StudentAvatarProps> = ({
  studentId,
  studentName,
  showHoverScale = false,
  variant = "rounded",
}) => {
  const sizeClass = variant === "circle" ? "size-10 rounded-full bg-blue-50" : "size-10 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm";
  const hoverClass = showHoverScale ? "transition-transform group-hover:scale-110" : "";

  return (
    <div className={`${sizeClass} ${hoverClass}`}>
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`}
        alt={studentName}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default StudentAvatar;

import React, { useState } from 'react';
import {
  Users,
  Shield,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { Class } from '../../types/class';
import type { Teacher } from '../../types/teacher';

interface ClassInchargeCardProps {
  classData: Class;
  teachers: Teacher[];
  onAssign: (classId: string, teacherId: number | null) => void;
  isUpdating: boolean;
}

const ClassInchargeCard: React.FC<ClassInchargeCardProps> = ({
  classData,
  teachers,
  onAssign,
  isUpdating,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const hasIncharge = !!classData.inchargeId;

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-rose-100 text-rose-600',
      'bg-amber-100 text-amber-600',
      'bg-cyan-100 text-cyan-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSelectTeacher = (teacherId: number | null) => {
    onAssign(classData.id, teacherId);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:shadow-sm hover:border-slate-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-black text-sm">
              {classData.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">
              {classData.name}
              {classData.section && ` - ${classData.section}`}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Users className="size-3" />
              {classData.studentCount} {classData.studentCount === 1 ? 'student' : 'students'}
            </p>
          </div>
        </div>
      </div>

      {/* Incharge Row */}
      <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
        {hasIncharge && classData.inchargeName ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${getAvatarColor(
                  classData.inchargeName
                )}`}
              >
                {classData.inchargeName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                {classData.inchargeName}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Change Incharge"
              >
                {isUpdating ? (
                  <Loader2 className="size-4 animate-spin text-blue-500" />
                ) : (
                  <ChevronDown className={`size-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[150px]">
                    <div className="p-1.5">
                      <button
                        onClick={() => handleSelectTeacher(null)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 rounded-lg"
                      >
                        Remove Incharge
                      </button>
                      {teachers
                        .filter((t) => t.isActive && t.id !== classData.inchargeId)
                        .map((teacher) => (
                          <button
                            key={teacher.id}
                            onClick={() => handleSelectTeacher(teacher.id)}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2"
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${getAvatarColor(
                                teacher.fullName
                              )}`}
                            >
                              {teacher.fullName.charAt(0)}
                            </div>
                            <span className="truncate">{teacher.fullName}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                <Shield className="size-3.5 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400">No incharge</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isUpdating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    Assign
                    <ChevronDown className={`size-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[150px]">
                    <div className="p-1.5">
                      {teachers.filter((t) => t.isActive).length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-400 text-center">
                          No teachers
                        </p>
                      ) : (
                        teachers
                          .filter((t) => t.isActive)
                          .map((teacher) => (
                            <button
                              key={teacher.id}
                              onClick={() => handleSelectTeacher(teacher.id)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2"
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${getAvatarColor(
                                  teacher.fullName
                                )}`}
                              >
                                {teacher.fullName.charAt(0)}
                              </div>
                              <span className="truncate">{teacher.fullName}</span>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassInchargeCard;

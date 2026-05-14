import React from "react";

interface StudentListSkeletonProps {
  count?: number;
}

export const StudentListSkeleton: React.FC<StudentListSkeletonProps> = ({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

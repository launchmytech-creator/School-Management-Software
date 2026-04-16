import React, { useState, useMemo } from "react";
import { Trash2, Calendar, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface TeacherAllocation {
  id: number;
  teacherName: string;
  subjectName: string;
  className: string;
  classSection?: string;
  yearName: string;
  createdAt?: string;
}

interface AllocationTableProps {
  allocations: TeacherAllocation[];
  isLoading: boolean;
  onDelete: (id: number) => void;
}

const ITEMS_PER_PAGE = 10;

export const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  isLoading,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedAllocations = useMemo(() => {
    return [...allocations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [allocations]);

  const totalPages = Math.ceil(sortedAllocations.length / ITEMS_PER_PAGE);

  const paginatedAllocations = useMemo(() => {
    return sortedAllocations.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [sortedAllocations, currentPage]);

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, sortedAllocations.length);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-y border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Teacher
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Subject
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                Class
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                Section
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                Year
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAllocations.map((alloc) => (
              <tr key={alloc.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-black text-xs">
                      {alloc.teacherName.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 text-sm tracking-tight">
                      {alloc.teacherName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-slate-500 text-sm font-medium tracking-tight">
                    {alloc.subjectName}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-slate-500 text-sm font-medium tracking-tight">
                    {alloc.className}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-slate-500 text-sm font-medium tracking-tight">
                    {alloc.classSection || "-"}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 font-medium text-xs">
                    <Calendar className="size-3.5" />
                    {alloc.yearName}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onDelete(alloc.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Remove Allocation"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Loader2 className="size-10 animate-spin mx-auto text-blue-500 opacity-20" />
                </td>
              </tr>
            )}
            {allocations.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="size-12 text-slate-200" />
                    <p className="text-slate-400 font-medium">
                      No subject allocations found
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Showing {startItem}-{endItem} of {sortedAllocations.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all ${
                  currentPage === page
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

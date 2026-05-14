import React, { useState, useMemo } from "react";
import { Trash2, Calendar, Users, Loader2 } from "lucide-react";
import Pagination from "../common/Pagination";

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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedAllocations.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

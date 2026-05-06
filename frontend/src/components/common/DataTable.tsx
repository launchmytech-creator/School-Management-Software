import React, { memo, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from '../ui/button';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  className?: string;
}

interface TableRowProps<T> {
  item: T;
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
}

const TableRow = memo(<T,>({ item, columns, keyExtractor, onRowClick }: TableRowProps<T>) => (
  <tr
    onClick={() => onRowClick?.(item)}
    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
      onRowClick ? 'cursor-pointer' : ''
    }`}
  >
    {columns.map((col) => (
      <td
        key={col.key}
        className={`px-6 py-4 text-sm text-slate-700 ${col.className || ''}`}
      >
        {col.render
          ? col.render(item)
          : (item as Record<string, unknown>)[col.key] as React.ReactNode}
      </td>
    ))}
  </tr>
));
TableRow.displayName = "TableRow";

const SkeletonRow = memo(({ columns }: { columns: Column<unknown>[] }) => (
  <tr className="border-b border-slate-100">
    {columns.map((col) => (
      <td key={col.key} className="px-6 py-4">
        <div className="h-4 bg-slate-100 rounded animate-pulse" />
      </td>
    ))}
  </tr>
));
SkeletonRow.displayName = "SkeletonRow";

const EmptyState = memo(({
  emptyMessage,
  emptyDescription,
  columns,
}: {
  emptyMessage: string;
  emptyDescription?: string;
  columns: Column<unknown>[];
}) => (
  <tr>
    <td colSpan={columns.length} className="px-6 py-16 text-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-xs text-slate-400 mt-1">{emptyDescription}</p>
        )}
      </div>
    </td>
  </tr>
));
EmptyState.displayName = "EmptyState";

const PaginationButton = memo(({
  page,
  isActive,
  onClick,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <Button
    variant={isActive ? 'default' : 'outline'}
    size="icon"
    className="size-8 text-xs"
    onClick={onClick}
  >
    {page}
  </Button>
));
PaginationButton.displayName = "PaginationButton";

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data found',
  emptyDescription,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onRowClick,
  className = ''
}: DataTableProps<T>) {
  const startItem = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage]);
  const endItem = useMemo(() => Math.min(currentPage * itemsPerPage, totalItems), [currentPage, itemsPerPage, totalItems]);

  const handlePreviousPage = useCallback(() => {
    onPageChange?.(currentPage - 1);
  }, [onPageChange, currentPage]);

  const handleNextPage = useCallback(() => {
    onPageChange?.(currentPage + 1);
  }, [onPageChange, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))
            ) : data.length === 0 ? (
              <EmptyState
                emptyMessage={emptyMessage}
                emptyDescription={emptyDescription}
                columns={columns}
              />
            ) : (
              data.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  item={item}
                  columns={columns}
                  keyExtractor={keyExtractor}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Showing {startItem} to {endItem} of {totalItems} results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {pageNumbers.map((pageNum) => (
              <PaginationButton
                key={pageNum}
                page={pageNum}
                isActive={currentPage === pageNum}
                onClick={() => onPageChange?.(pageNum)}
              />
            ))}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
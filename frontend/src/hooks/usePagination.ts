import { useState, useMemo } from 'react';

interface UsePaginationOptions<T> {
  items: T[];
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  currentItems: T[];
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
  paginatedItems: T[][];
}

export function usePagination<T>({
  items,
  pageSize = 10,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginatedItems = useMemo(() => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
      chunks.push(items.slice(i, i + pageSize));
    }
    return chunks;
  }, [items, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const currentItems = paginatedItems[safePage - 1] || [];

  const setPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const nextPage = () => setPage(safePage + 1);
  const prevPage = () => setPage(safePage - 1);
  const resetPage = () => setCurrentPage(1);

  return {
    currentPage: safePage,
    totalPages,
    currentItems,
    pageSize,
    totalItems: items.length,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    setPage,
    nextPage,
    prevPage,
    resetPage,
    paginatedItems,
  };
}

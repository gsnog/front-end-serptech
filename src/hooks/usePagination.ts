import { useState, useMemo, useEffect } from 'react';

export const PAGE_SIZE = 20;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // reset to page 1 when items length changes (e.g. filter applied)
  useEffect(() => { setPage(1); }, [items.length]);

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage]
  );

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    page: safePage,
    goToPage,
    totalPages,
    paginatedItems,
    total: items.length,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

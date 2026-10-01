'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, totalCount, onPageChange }: Props) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Show at most 5 page numbers
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Phân trang">
      <Button
        variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(page - 1)} disabled={!canPrev}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {start > 1 && (
        <>
          <PageBtn n={1} current={page} onClick={onPageChange} />
          {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}

      {pages.map((n) => (
        <PageBtn key={n} n={n} current={page} onClick={onPageChange} />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <PageBtn n={totalPages} current={page} onClick={onPageChange} />
        </>
      )}

      <Button
        variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(page + 1)} disabled={!canNext}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

function PageBtn({ n, current, onClick }: { n: number; current: number; onClick: (n: number) => void }) {
  return (
    <Button
      variant={n === current ? 'default' : 'outline'}
      size="icon"
      className="h-8 w-8 text-sm"
      onClick={() => onClick(n)}
      aria-current={n === current ? 'page' : undefined}
    >
      {n}
    </Button>
  );
}

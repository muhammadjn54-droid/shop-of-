import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const Pagination = ({
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  hasNext = false,
  hasPrevious = false,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#f8fafc] border-t border-[#cbd5e1] text-xs text-[#64748b] select-none">
      <div className="flex items-center gap-2">
        <span className="font-medium text-[#334155]">
          Всего записей: <strong className="text-[#107c41] font-semibold">{totalCount}</strong>
        </span>
        <span className="text-[#cbd5e1]">|</span>
        <span>
          Страница <strong className="text-[#334155]">{currentPage}</strong> из <strong className="text-[#334155]">{totalPages}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious && currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Предыдущая страница"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Назад</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-6 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-[#107c41] text-white font-semibold'
                    : 'bg-white text-[#475569] border border-[#cbd5e1] hover:bg-[#f1f5f9]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext && currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Следующая страница"
        >
          <span>Вперёд</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

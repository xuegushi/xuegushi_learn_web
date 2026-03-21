"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** 增强版分页组件 */
function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  showFirstLast = true,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 border-t">
      {showFirstLast && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            首页
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
        </>
      )}
      <span className="text-sm text-muted-foreground">
        第 {currentPage} / {totalPages} 页
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一页
      </button>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          尾页
        </button>
      )}
    </div>
  );
}

/** 简化版分页组件（仅左右箭头） */
function SimplePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-muted-foreground">
        共 {totalCount} 条
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { Pagination, SimplePagination };

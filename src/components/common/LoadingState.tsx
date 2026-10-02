import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Загрузка данных...' }: LoadingStateProps) => {
  return (
    <div className="w-full p-8 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2.5 text-[#107c41] bg-white border border-[#e2e8f0] px-4 py-2.5 rounded shadow-xs">
        <Loader2 className="w-4 h-4 animate-spin text-[#107c41]" />
        <span className="text-xs font-medium text-[#334155]">{message}</span>
      </div>
    </div>
  );
};

export interface ExcelTableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const ExcelTableSkeleton = ({ rows = 5, cols = 8 }: ExcelTableSkeletonProps) => {
  return (
    <div className="w-full animate-pulse overflow-hidden border border-[#e2e8f0]">
      <div className="h-8 bg-[#f1f5f9] border-b border-[#cbd5e1] flex items-center">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-[#cbd5e1] rounded mx-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-9 border-b border-[#e2e8f0] bg-white flex items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-[#f1f5f9] rounded mx-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingState;

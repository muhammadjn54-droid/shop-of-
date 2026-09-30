import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Нет данных',
  description = 'Записи отсутствуют или не найдены по запросу.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center bg-white border border-[#e2e8f0] rounded">
      <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#107c41] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#1e293b] mb-1">{title}</h3>
      <p className="text-xs text-[#64748b] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-medium rounded transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

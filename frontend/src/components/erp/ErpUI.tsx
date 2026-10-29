import type { ComponentType, ReactNode } from 'react';
import { X, RefreshCw } from 'lucide-react';

export const inputCls =
  'w-full h-9 px-2.5 rounded border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1e293b] dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]/20';
export const selectCls = inputCls;
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-medium rounded shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 text-xs font-medium rounded shadow-2xs transition-colors disabled:opacity-50 cursor-pointer';
export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-[#fca5a5] dark:border-rose-900 text-[#dc2626] dark:text-rose-400 hover:bg-[#fef2f2] dark:hover:bg-rose-950/40 text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer';

export const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  children?: ReactNode;
}) => (
  <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-md p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h1 className="text-sm font-bold text-[#1e293b] dark:text-slate-100 leading-tight">{title}</h1>
        <p className="text-[11px] text-[#64748b] dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {onRefresh && (
        <button type="button" onClick={onRefresh} className={btnSecondary} title="Обновить">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
      {children}
    </div>
  </div>
);

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-md shadow-2xs ${className}`}>
    {children}
  </div>
);

export const SectionTitle = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="bg-[#f8fafc] dark:bg-slate-950/40 border-b border-[#e2e8f0] dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2">
    <div>
      <h2 className="font-semibold text-xs text-[#1e293b] dark:text-slate-200">{title}</h2>
      {subtitle && <p className="text-[10px] text-[#64748b] dark:text-slate-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3">
      <div
        className={`bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg shadow-2xl w-full ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        } max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#e2e8f0] dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-[#1e293b] dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#64748b] dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#64748b] hover:text-[#1e293b] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-[#e2e8f0] dark:border-slate-800 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Field = ({
  label,
  children,
  hint,
  className = '',
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) => (
  <label className={`block ${className}`}>
    <span className="block text-[11px] font-semibold text-[#475569] dark:text-slate-300 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-[#94a3b8] mt-0.5">{hint}</span>}
  </label>
);

export const StatCard = ({
  label,
  value,
  tone = 'slate',
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: 'slate' | 'green' | 'blue' | 'amber' | 'rose' | 'violet';
  sub?: string;
}) => {
  const tones: Record<string, string> = {
    slate: 'text-[#1e293b] dark:text-slate-100',
    green: 'text-[#15803d] dark:text-emerald-400',
    blue: 'text-[#0369a1] dark:text-sky-400',
    amber: 'text-[#b45309] dark:text-amber-400',
    rose: 'text-[#b91c1c] dark:text-rose-400',
    violet: 'text-[#7c3aed] dark:text-violet-400',
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
      <p className="text-[11px] font-medium text-[#64748b] dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-bold tabular-nums truncate ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#94a3b8] mt-0.5 truncate">{sub}</p>}
    </div>
  );
};

export const Th = ({ children, right }: { children?: ReactNode; right?: boolean }) => (
  <th className={`excel-header-cell ${right ? 'text-right' : ''}`}>{children}</th>
);

export const Td = ({
  children,
  right,
  className = '',
}: {
  children?: ReactNode;
  right?: boolean;
  className?: string;
}) => <td className={`excel-cell ${right ? 'text-right tabular-nums' : ''} ${className}`}>{children}</td>;

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="p-8 text-center text-xs text-[#64748b] dark:text-slate-400">{children}</div>
);

export const Spinner = ({ label = 'Загрузка...' }: { label?: string }) => (
  <div className="p-8 flex items-center justify-center gap-2 text-xs text-[#64748b] dark:text-slate-400">
    <RefreshCw className="w-4 h-4 animate-spin" />
    {label}
  </div>
);

export const statusLabel: Record<string, string> = {
  draft: 'Черновик',
  ordered: 'Заказано',
  partially_received: 'Частично получено',
  received: 'Получено',
  paid: 'Оплачено',
  partially_paid: 'Частично оплачено',
  cancelled: 'Отменено',
  open: 'Открыта',
  closed: 'Закрыта',
  in_progress: 'В процессе',
  completed: 'Завершена',
  shipped: 'Отправлено',
  pending: 'Ожидает',
  succeeded: 'Синхронизировано',
  failed: 'Ошибка',
  processing: 'Обработка',
};

export const StatusBadge = ({ status }: { status: string }) => {
  const tone =
    ['received', 'paid', 'completed', 'succeeded', 'closed'].includes(status)
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
      : ['cancelled', 'failed'].includes(status)
      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
      : ['ordered', 'partially_received', 'partially_paid', 'open', 'shipped'].includes(status)
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-semibold whitespace-nowrap ${tone}`}>
      {statusLabel[status] || status}
    </span>
  );
};

export const Tabs = ({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
}) => (
  <div className="flex items-center gap-1 overflow-x-auto border-b border-[#e2e8f0] dark:border-slate-800 px-3 pt-2">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
          active === tab.id
            ? 'border-[#107c41] text-[#107c41] dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-transparent text-[#64748b] dark:text-slate-400 hover:text-[#1e293b] dark:hover:text-slate-200'
        }`}
      >
        {tab.label}
        {tab.count !== undefined && <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>}
      </button>
    ))}
  </div>
);

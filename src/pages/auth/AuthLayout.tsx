import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, FileSpreadsheet, Lock } from 'lucide-react';

export const authInputClass = 'w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all disabled:bg-[#f8fafc]';
export const authButtonClass = 'w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-wait cursor-pointer';
export const authLinkClass = 'font-medium text-[#107c41] hover:text-[#0d6936] hover:underline';

export const AuthLayout = ({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-center items-center p-4 font-['Inter',sans-serif]">
    <div className="w-full max-w-md mb-4 text-center">
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#107c41] text-white rounded-md shadow-sm">
        <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
        <span className="font-bold text-sm tracking-tight">Shop Inventory</span>
        <span className="text-[10px] bg-[#0d6936] px-1.5 py-0.5 rounded text-emerald-100 uppercase tracking-wider font-semibold">Excel CRM</span>
      </div>
      <p className="text-xs text-[#64748b] mt-2">Личная система учёта товаров, склада, продаж и прибыли</p>
    </div>
    <div className="w-full max-w-md bg-white rounded-md border border-[#cbd5e1] shadow-md overflow-hidden">
      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
        <h1 className="text-base font-bold text-[#1e293b]">{title}</h1>
        <p className="text-xs text-[#64748b] mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  </div>
);

export const AuthError = ({ message }: { message: string }) => message ? (
  <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs break-words">{message}</div>
) : null;

export const PasswordField = ({ label, id, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & { label: string; id: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-[#334155] mb-1">{label}</label>
      <div className="relative flex items-center">
        <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
        <input {...props} id={id} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${authInputClass} pl-9 pr-10`} />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Скрыть: ${label}` : `Показать: ${label}`} aria-pressed={visible} className="absolute right-3 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

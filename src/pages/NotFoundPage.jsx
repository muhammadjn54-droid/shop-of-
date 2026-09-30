import React from 'react';
import { Link } from 'react-router';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-['Inter',sans-serif] text-center">
      <div className="max-w-md w-full bg-white border border-[#cbd5e1] rounded-md p-6 sm:p-8 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center mx-auto mb-4 border border-[#e2e8f0]">
          <FileQuestion className="w-7 h-7 text-[#107c41]" />
        </div>

        <h1 className="text-3xl font-extrabold text-[#1e293b] mb-1 tracking-tight">404</h1>
        <h2 className="text-sm font-bold text-[#334155] mb-2">Страница не найдена</h2>
        <p className="text-xs text-[#64748b] mb-6 leading-relaxed">
          Запрошенный адрес не существует или страница недоступна для вашей учётной записи.
        </p>

        <div className="flex items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-semibold rounded transition-colors shadow-2xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>На главную</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

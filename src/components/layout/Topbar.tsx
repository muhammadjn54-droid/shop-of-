import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, LogOut, FileSpreadsheet, ChevronDown, Calendar, Mail } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-12 bg-[#107c41] text-white flex items-center justify-between px-3 md:px-4 shadow-sm select-none z-20">
        {/* Left section: Hamburger for mobile + App title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded hover:bg-[#0d6936] text-white transition-colors"
            title="Меню"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white text-[#107c41] rounded flex items-center justify-center font-bold text-sm shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight tracking-tight text-white flex items-center gap-1.5">
                <span>Shop Inventory</span>
                <span className="hidden sm:inline-block text-[10px] font-normal px-1.5 py-0.2 bg-[#0d6936] rounded text-emerald-100">
                  Excel CRM
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right section: User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d6936] hover:bg-[#0a522a] border border-[#185a37] text-xs font-medium text-white transition-all shadow-2xs"
          >
            <div className="w-5 h-5 rounded-full bg-white text-[#107c41] flex items-center justify-center font-bold text-[11px]">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="max-w-[120px] truncate">{user?.username || 'Пользователь'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded shadow-lg border border-[#cbd5e1] text-[#1e293b] py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#e2e8f0] bg-[#f8fafc]">
                <p className="font-semibold text-[#1e293b] truncate">{user?.username}</p>
                {user?.email && (
                  <p className="text-[11px] text-[#64748b] truncate">{user.email}</p>
                )}
                {user?.date_joined && (
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    В системе с {formatDate(user.date_joined)}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setAccountModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#f1f5f9] text-[#334155] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#64748b]" />
                <span>Мой аккаунт</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#fef2f2] text-[#dc2626] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Account Info Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#cbd5e1] shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="font-semibold text-xs flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Мой аккаунт</span>
              </h3>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="text-emerald-100 hover:text-white text-base leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8f0]">
                <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#107c41] border border-[#86efac] flex items-center justify-center text-lg font-bold">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1e293b]">{user?.username}</h4>
                  <p className="text-[11px] text-[#107c41] font-medium">Аккаунт активен</p>
                </div>
              </div>

              <div className="space-y-2 text-[#475569]">
                <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">ID пользователя:</span>
                  <span className="font-mono font-medium text-[#1e293b]">{user?.id || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b] flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email:
                  </span>
                  <span className="font-medium text-[#1e293b]">{user?.email || 'Не указан'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748b] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Регистрация:
                  </span>
                  <span className="font-medium text-[#1e293b]">{formatDate(user?.date_joined)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e2e8f0] flex justify-end">
                <button
                  onClick={() => setAccountModalOpen(false)}
                  className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded font-medium text-xs transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;

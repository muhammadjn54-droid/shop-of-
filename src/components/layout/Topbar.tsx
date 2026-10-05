import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, LogOut, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
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
                  navigate('/account');
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

    </>
  );
};

export default Topbar;

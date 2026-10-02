import { NavLink } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Обзор', path: '/', icon: LayoutDashboard },
    { name: 'Товары', path: '/products', icon: Package },
    { name: 'Продажи', path: '/sales', icon: ShoppingCart },
    { name: 'Статистика', path: '/statistics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-[#cbd5e1] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 py-4 px-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Управление
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#107c41]/10 text-[#107c41] font-semibold border-l-3 border-[#107c41]'
                      : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User info & Logout at bottom */}
        <div className="p-3 border-t border-[#cbd5e1] bg-[#f8fafc]">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-[#107c41] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#1e293b] truncate" title={user?.username}>
                {user?.username || 'Пользователь'}
              </p>
              <p className="text-[10px] text-[#64748b] truncate" title={user?.email || 'Без email'}>
                {user?.email || 'Склад активен'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded border border-[#fca5a5] bg-white hover:bg-[#fef2f2] text-[#dc2626] text-xs font-medium transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

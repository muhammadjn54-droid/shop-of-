import { useState } from 'react';
import { Outlet } from 'react-router';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Inter',sans-serif]">
      {/* Topbar */}
      <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-3 sm:p-4 md:p-6 flex flex-col">
          <Outlet key={user?.id} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { PageSkeleton } from '../common/AppLoader';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import MobileBottomBar from './MobileBottomBar';

export const AppLayout = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f5f1] flex flex-col font-['Inter',sans-serif]">
      {/* Topbar */}
      <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Workspace */}
      <div className="flex-1 flex items-start">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 self-stretch bg-[#f3f5f1] p-3 pb-24 sm:p-5 sm:pb-24 md:p-8 md:pb-8 flex flex-col">
          <Suspense fallback={<PageSkeleton />}>
            <div key={pathname} className="page-enter flex-1 flex flex-col">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>

      {/* Phone-style Bottom Navigation Bar */}
      <MobileBottomBar />
    </div>
  );
};

export default AppLayout;

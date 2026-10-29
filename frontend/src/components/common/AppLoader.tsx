import { Store } from 'lucide-react';

/** Full-screen branded loader: app shell skeleton with a pulsing logo. */
export const AppLoader = () => (
  <div className="min-h-screen flex bg-[#f3f5f1] dark:bg-[#0a1410]" role="status" aria-label="Loading">
    <aside className="hidden md:flex w-64 flex-col gap-3 p-4 bg-[#0e2a21]">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="skeleton-dark w-9 h-9 rounded-xl" />
        <div className="skeleton-dark h-4 w-24 rounded" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-dark h-9 rounded-[10px]" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </aside>
    <div className="flex-1 flex items-center justify-center">
      <div className="loader-logo w-14 h-14 rounded-2xl bg-[#0f7a55] text-white flex items-center justify-center">
        <Store className="w-7 h-7" />
      </div>
    </div>
  </div>
);

/** In-page skeleton shown while a route chunk or its first data loads. */
export const PageSkeleton = () => (
  <div className="w-full space-y-5" role="status" aria-label="Loading">
    <div className="space-y-2">
      <div className="skeleton h-7 w-56 rounded-lg" />
      <div className="skeleton h-4 w-80 max-w-full rounded" />
    </div>
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
    <div className="skeleton h-72 rounded-2xl" />
  </div>
);

export default AppLoader;

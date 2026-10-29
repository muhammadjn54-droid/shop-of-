// Route chunk preloaders: warm the lazy chunks on hover/idle so navigation feels instant.
const loaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/DashboardPage'),
  '/pos': () => import('../pages/PosPage'),
  '/debts': () => import('../pages/DebtsPage'),
  '/products': () => import('../pages/products/ProductsPage'),
  '/sales': () => import('../pages/SalesPage'),
  '/statistics': () => import('../pages/StatisticsPage'),
  '/employees': () => import('../pages/EmployeesPage'),
  '/stock': () => import('../pages/erp/StockPage'),
  '/reports': () => import('../pages/erp/ReportsPage'),
  '/ai': () => import('../pages/erp/AiPage'),
  '/settings': () => import('../pages/erp/SettingsPage'),
  '/profile': () => import('../pages/ProfilePage'),
};

const done = new Set<string>();

export const prefetchRoute = (path: string) => {
  const load = loaders[path];
  if (!load || done.has(path)) return;
  done.add(path);
  load().catch(() => done.delete(path));
};

export const prefetchCoreRoutes = () => {
  const run = () => ['/', '/pos', '/products', '/sales'].forEach(prefetchRoute);
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run);
  else setTimeout(run, 1500);
};

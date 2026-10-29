export type Role = 'owner' | 'manager' | 'cashier' | 'warehouse' | 'accountant';

export type Permission =
  | 'pos'
  | 'sales.read'
  | 'sales.refund'
  | 'products.read'
  | 'products.write'
  | 'stock.read'
  | 'stock.adjust'
  | 'purchases.read'
  | 'purchases.write'
  | 'suppliers.read'
  | 'suppliers.write'
  | 'shifts.read'
  | 'shifts.manage'
  | 'expenses.read'
  | 'expenses.write'
  | 'customers.read'
  | 'customers.write'
  | 'loyalty.manage'
  | 'reports.read'
  | 'finance.read'
  | 'branches.manage'
  | 'inventory.manage'
  | 'audit.read'
  | 'settings.manage'
  | 'telegram.manage'
  | 'ai.use';

const ALL: Permission[] = [
  'pos', 'sales.read', 'sales.refund', 'products.read', 'products.write',
  'stock.read', 'stock.adjust', 'purchases.read', 'purchases.write',
  'suppliers.read', 'suppliers.write', 'shifts.read', 'shifts.manage',
  'expenses.read', 'expenses.write', 'customers.read', 'customers.write',
  'loyalty.manage', 'reports.read', 'finance.read', 'branches.manage',
  'inventory.manage', 'audit.read', 'settings.manage', 'telegram.manage', 'ai.use',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  manager: [
    'pos', 'sales.read', 'sales.refund', 'products.read', 'products.write',
    'stock.read', 'stock.adjust', 'purchases.read', 'purchases.write',
    'suppliers.read', 'suppliers.write', 'shifts.read', 'shifts.manage',
    'expenses.read', 'expenses.write', 'customers.read', 'customers.write',
    'loyalty.manage', 'reports.read', 'finance.read', 'inventory.manage',
    'audit.read', 'ai.use',
  ],
  cashier: [
    'pos', 'sales.read', 'products.read', 'stock.read', 'shifts.read',
    'shifts.manage', 'customers.read', 'customers.write', 'reports.read',
  ],
  warehouse: [
    'products.read', 'products.write', 'stock.read', 'stock.adjust',
    'purchases.read', 'purchases.write', 'suppliers.read', 'inventory.manage',
  ],
  accountant: [
    'sales.read', 'products.read', 'stock.read', 'purchases.read',
    'suppliers.read', 'expenses.read', 'expenses.write',
    'customers.read', 'reports.read', 'finance.read', 'audit.read',
  ],
};

export function normalizeRole(role?: string | null): Role {
  const r = (role || 'owner').toLowerCase();
  if (r === 'admin' || r === 'superadmin' || r === 'super_admin') return 'owner';
  if (r === 'seller') return 'cashier';
  if (r === 'storekeeper' || r === 'warehouse_worker') return 'warehouse';
  if (r in ROLE_PERMISSIONS) return r as Role;
  return 'owner';
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized].includes(permission);
}

export function assertPermission(role: string | null | undefined, permission: Permission) {
  if (!hasPermission(role, permission)) {
    const err: any = new Error('Недостаточно прав для выполнения этого действия');
    err.status = 403;
    throw err;
  }
}

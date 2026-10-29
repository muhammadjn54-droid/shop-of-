import type { Employee } from '../types';

export const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Муҳаммад',
    position: 'Мудир',
    baseSalary: 2500,
    hasRest: true,
    restDays: 4,
    absentDays: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Алиҷон',
    position: 'Кассир',
    baseSalary: 2000,
    hasRest: false,
    restDays: 0,
    absentDays: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Рустам',
    position: 'Коргар',
    baseSalary: 2000,
    hasRest: true,
    restDays: 4,
    absentDays: 4,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'shop_employees_list';

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load employees from storage:', e);
  }
  return [];
}

export function saveStoredEmployees(list: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save employees to storage:', e);
  }
}

export function calculateSalary(emp: Employee, totalMonthDays = 30) {
  // 1. Рӯзҳои корӣ дар моҳ
  const workingDays = emp.hasRest ? Math.max(1, totalMonthDays - emp.restDays) : totalMonthDays;
  // 2. Нархи 1 рӯзи корӣ
  const dailyRate = emp.baseSalary / workingDays;
  // 3. Рӯзҳое, ки кор кардааст
  const workedDays = Math.max(0, workingDays - emp.absentDays);
  // 4. Маблағи ҷарима (минус барои наомадан)
  const deducted = emp.absentDays * dailyRate;
  // 5. Маоши ниҳоӣ барои пардохт
  const finalSalary = workedDays * dailyRate;

  return {
    workingDays,
    dailyRate: Math.round(dailyRate),
    deducted: Math.round(deducted),
    finalSalary: Math.round(finalSalary),
    workedDays,
  };
}

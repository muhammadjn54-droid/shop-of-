export function toNum(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

export function money(value: unknown): number {
  return Math.round(toNum(value) * 100) / 100;
}

export function intVal(value: unknown, fallback = 0): number {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function clampPage(value: unknown, fallback = 1): number {
  return Math.max(1, intVal(value, fallback));
}

export function clampLimit(value: unknown, fallback = 20, max = 200): number {
  return Math.max(1, Math.min(max, intVal(value, fallback)));
}

export function dateOnly(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function periodBounds(period?: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  if (from || to) {
    return { start: dateOnly(from), end: to ? endOfDay(dateOnly(to) as Date) : null };
  }

  switch ((period || '').toLowerCase()) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = startOfDay(y);
      end = endOfDay(y);
      break;
    }
    case 'week': {
      const s = new Date(now);
      const day = (s.getDay() + 6) % 7;
      s.setDate(s.getDate() - day);
      start = startOfDay(s);
      end = endOfDay(now);
      break;
    }
    case 'last_week': {
      const s = new Date(now);
      const day = (s.getDay() + 6) % 7;
      s.setDate(s.getDate() - day - 7);
      start = startOfDay(s);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      end = endOfDay(e);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = endOfDay(now);
      break;
    }
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      end = endOfDay(now);
      break;
    }
    default:
      start = null;
      end = null;
  }
  return { start, end };
}

export function dateWhere(field = 'createdAt', start?: Date | null, end?: Date | null) {
  if (!start && !end) return {};
  return {
    [field]: {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    },
  };
}

export function nextNumber(prefix: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    count: total,
    page,
    limit,
    next: page * limit < total ? `?page=${page + 1}&limit=${limit}` : null,
    previous: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
  };
}

export function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
}

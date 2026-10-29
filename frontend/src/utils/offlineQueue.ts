import { syncApi } from '../api/erp';
import type { CheckoutPayload } from '../types/erp';

const KEY = 'shop_offline_queue';

export interface QueuedOperation {
  clientTransactionId: string;
  type: 'sale' | 'return';
  payload: Record<string, unknown>;
  queuedAt: string;
  totalAmount: number;
  itemsCount: number;
}

const read = (): QueuedOperation[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
  } catch {
    return [];
  }
};

const write = (ops: QueuedOperation[]) => {
  localStorage.setItem(KEY, JSON.stringify(ops));
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: ops.length }));
};

export const getOfflineQueue = (): QueuedOperation[] => read();

export const offlineQueueCount = (): number => read().length;

export const enqueueSale = (payload: CheckoutPayload): QueuedOperation => {
  const op: QueuedOperation = {
    clientTransactionId: payload.clientTransactionId || `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'sale',
    payload: { ...payload, clientTransactionId: payload.clientTransactionId },
    queuedAt: new Date().toISOString(),
    totalAmount: Number(payload.items.reduce((s, i) => s + Number(i.price || 0) * i.quantity, 0)),
    itemsCount: payload.items.reduce((s, i) => s + i.quantity, 0),
  };
  op.payload.clientTransactionId = op.clientTransactionId;
  const ops = read();
  if (!ops.some((o) => o.clientTransactionId === op.clientTransactionId)) ops.push(op);
  write(ops);
  return op;
};

export const removeOfflineOperation = (clientTransactionId: string) => {
  write(read().filter((o) => o.clientTransactionId !== clientTransactionId));
};

export const flushOfflineQueue = async (): Promise<{ succeeded: number; failed: number }> => {
  const ops = read();
  if (!ops.length) return { succeeded: 0, failed: 0 };
  const result = await syncApi.push(
    ops.map((o) => ({ clientTransactionId: o.clientTransactionId, type: o.type, payload: o.payload }))
  );
  const succeededIds = new Set(
    result.results.filter((r) => r.status === 'succeeded').map((r) => r.clientTransactionId)
  );
  write(read().filter((o) => !succeededIds.has(o.clientTransactionId)));
  return { succeeded: result.succeeded, failed: result.failed };
};

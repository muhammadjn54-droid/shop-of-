import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings,
  Save,
  Building2,
  Send,
  History,
  RefreshCw,
  Plus,
  Trash2,
  CloudOff,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { settingsApi, branchesApi, auditApi, syncApi } from '../../api/erp';
import { flushOfflineQueue, getOfflineQueue } from '../../utils/offlineQueue';
import type { AppSettings, AuditEntry, Branch, OfflineOperation } from '../../types/erp';
import { formatDateTime } from '../../utils/formatters';
import {
  PageHeader,
  Card,
  SectionTitle,
  Modal,
  Field,
  Tabs,
  Th,
  Td,
  Empty,
  Spinner,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputCls,
} from '../../components/erp/ErpUI';

const generalFields: Array<{ key: string; label: string; type?: string; placeholder?: string }> = [
  { key: 'shop_name', label: 'Название магазина' },
  { key: 'shop_phone', label: 'Телефон магазина' },
  { key: 'shop_address', label: 'Адрес магазина' },
  { key: 'currency', label: 'Валюта (код)', placeholder: 'TJS' },
  { key: 'receipt_footer', label: 'Текст внизу чека' },
  { key: 'loyalty_points_per_unit', label: 'Бонусов за 1 единицу', type: 'number' },
  { key: 'loyalty_point_value', label: 'Стоимость 1 бонуса', type: 'number' },
  { key: 'default_lead_time_days', label: 'Срок поставки по умолчанию, дней', type: 'number' },
  { key: 'tax_percent', label: 'Налог, %', type: 'number' },
];

export const SettingsPage = () => {
  const [tab, setTab] = useState('general');
  const [data, setData] = useState<AppSettings | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', isMain: false });
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [offline, setOffline] = useState<OfflineOperation[]>([]);
  const [localQueue, setLocalQueue] = useState(getOfflineQueue());
  const [telegramChat, setTelegramChat] = useState('');
  const [testText, setTestText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [settings, branchList] = await Promise.all([settingsApi.get(), branchesApi.list()]);
      setData(settings);
      setValues(settings.settings);
      setTelegramChat(settings.telegram.chatId || '');
      setBranches(branchList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    try {
      const res = await auditApi.list({ search: auditSearch, limit: 100 });
      setAudit(res.results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки журнала');
    }
  };

  const clearAudit = async () => {
    if (!window.confirm('Очистить все записи журнала действий?')) return;
    try {
      await auditApi.clear();
      toast.success('Журнал действий очищен');
      setAudit([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка очистки журнала');
    }
  };

  const loadOffline = async () => {
    try {
      const res = await syncApi.list({ limit: 100 });
      setOffline(res.results);
      setLocalQueue(getOfflineQueue());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки офлайн-операций');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === 'audit') loadAudit();
    if (tab === 'offline') loadOffline();
  }, [tab, auditSearch]);

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.save(values);
      toast.success('Настройки сохранены');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const linkTelegram = async () => {
    setSaving(true);
    try {
      await settingsApi.linkTelegram(telegramChat);
      toast.success(telegramChat ? 'Telegram привязан' : 'Telegram отвязан');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка привязки Telegram');
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    setSaving(true);
    try {
      await settingsApi.testTelegram(testText || undefined);
      toast.success('Тестовое сообщение отправлено');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSaving(false);
    }
  };

  const saveBranch = async () => {
    if (!branchForm.name.trim()) return toast.error('Укажите название филиала');
    setSaving(true);
    try {
      await branchesApi.create(branchForm);
      toast.success('Филиал добавлен');
      setBranchOpen(false);
      setBranchForm({ name: '', address: '', phone: '', isMain: false });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления филиала');
    } finally {
      setSaving(false);
    }
  };

  const removeBranch = async (branch: Branch) => {
    if (!window.confirm(`Удалить филиал «${branch.name}»?`)) return;
    try {
      await branchesApi.remove(branch.id);
      toast.success('Филиал удалён');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления филиала');
    }
  };

  const syncNow = async () => {
    setSaving(true);
    try {
      const res = await flushOfflineQueue();
      toast.success(`Синхронизировано: ${res.succeeded}, ошибок: ${res.failed}`);
      loadOffline();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка синхронизации');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-3">
      <PageHeader icon={Settings} title="Настройки системы" subtitle="Магазин, Telegram, филиалы, офлайн-синхронизация и журнал действий" onRefresh={load} />

      <Card>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'general', label: 'Общие' },
            { id: 'telegram', label: 'Telegram-бот' },
            { id: 'branches', label: 'Филиалы', count: branches.length },
            { id: 'offline', label: 'Офлайн', count: localQueue.length },
            { id: 'audit', label: 'Журнал действий' },
          ]}
        />

        {loading ? (
          <Spinner label="Загрузка настроек..." />
        ) : tab === 'general' ? (
          <>
            <SectionTitle title="Параметры магазина" subtitle="Используются в чеке, лояльности и уведомлениях" />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {generalFields.map((field) => (
                <Field key={field.key} label={field.label}>
                  <input
                    type={field.type || 'text'}
                    className={inputCls}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  />
                </Field>
              ))}
              <Field label="Уведомления о низком остатке">
                <select className={inputCls} value={values.low_stock_notifications ?? 'true'} onChange={(e) => setValues({ ...values, low_stock_notifications: e.target.value })}>
                  <option value="true">Включены</option>
                  <option value="false">Отключены</option>
                </select>
              </Field>
              <Field label="Уведомления о сроках годности">
                <select className={inputCls} value={values.expiry_notifications ?? 'true'} onChange={(e) => setValues({ ...values, expiry_notifications: e.target.value })}>
                  <option value="true">Включены</option>
                  <option value="false">Отключены</option>
                </select>
              </Field>
              <Field label="Telegram-уведомления">
                <select className={inputCls} value={values.telegram_notifications ?? 'true'} onChange={(e) => setValues({ ...values, telegram_notifications: e.target.value })}>
                  <option value="true">Включены</option>
                  <option value="false">Отключены</option>
                </select>
              </Field>
            </div>
            <div className="px-4 pb-4 flex justify-end">
              <button className={btnPrimary} onClick={save} disabled={saving}>
                <Save className="w-3.5 h-3.5" /> {saving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </>
        ) : tab === 'telegram' ? (
          <>
            <SectionTitle
              title="Telegram-бот"
              subtitle="Уведомления о продажах, остатках и долгах, а также команды /sales /stock /debt /status"
              action={<Send className="w-4 h-4 text-[#229ED9]" />}
            />
            <div className="p-4 space-y-3 max-w-xl">
              <div className={`p-3 rounded border text-xs ${data?.telegram.botConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                {data?.telegram.botConfigured ? (
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Бот настроен на сервере</span>
                ) : (
                  <span>Бот не настроен. Добавьте <code className="font-mono">TELEGRAM_BOT_TOKEN</code> в <code className="font-mono">backend/.env</code> и перезапустите сервер.</span>
                )}
              </div>
              <Field label="Ваш Telegram chat_id" hint="Отправьте боту команду /start и укажите полученный chat_id. Либо используйте код привязки из раздела профиля.">
                <input className={inputCls} value={telegramChat} onChange={(e) => setTelegramChat(e.target.value)} placeholder="123456789" />
              </Field>
              <div className="flex gap-2">
                <button className={btnPrimary} onClick={linkTelegram} disabled={saving}>Привязать chat_id</button>
                <button className={btnSecondary} onClick={() => { setTelegramChat(''); linkTelegram(); }} disabled={saving}>Отвязать</button>
              </div>
              <Field label="Тестовое сообщение">
                <input className={inputCls} value={testText} onChange={(e) => setTestText(e.target.value)} placeholder="🔔 Тест из Shop ERP" />
              </Field>
              <button className={btnSecondary} onClick={testTelegram} disabled={saving || !data?.telegram.botConfigured}>
                <Send className="w-3.5 h-3.5" /> Отправить тест
              </button>
            </div>
          </>
        ) : tab === 'branches' ? (
          <>
            <SectionTitle
              title="Филиалы и точки продаж"
              subtitle="Товары, продажи и расходы учитываются по филиалам"
              action={<button className={btnPrimary} onClick={() => setBranchOpen(true)}><Plus className="w-3.5 h-3.5" /> Добавить филиал</button>}
            />
            {branches.length === 0 ? (
              <Empty>Филиалы не добавлены. Основной филиал создаётся автоматически при регистрации.</Empty>
            ) : (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {branches.map((branch) => (
                  <div key={branch.id} className="border border-[#e2e8f0] dark:border-slate-800 rounded p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-[#107c41]/10 text-[#107c41] flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1e293b] dark:text-slate-100">
                            {branch.name}
                            {branch.isMain && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">основной</span>}
                          </p>
                          <p className="text-[10px] text-[#64748b] dark:text-slate-400">{branch.address || 'Адрес не указан'}</p>
                        </div>
                      </div>
                      <button className={btnDanger} onClick={() => removeBranch(branch)} disabled={branch.isMain} title={branch.isMain ? 'Основной филиал нельзя удалить' : 'Удалить'}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {branch.stats && (
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-[#64748b] dark:text-slate-400">
                        <span>Товаров: <b className="text-[#1e293b] dark:text-slate-200">{branch.stats.products}</b></span>
                        <span>Остаток: <b className="text-[#1e293b] dark:text-slate-200">{branch.stats.stock}</b></span>
                        <span>Продаж: <b className="text-[#1e293b] dark:text-slate-200">{branch.stats.salesCount}</b></span>
                        <span>Выручка: <b className="text-[#107c41]">{Number(branch.stats.salesTotal).toFixed(2)}</b></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : tab === 'offline' ? (
          <>
            <SectionTitle
              title="Офлайн-операции кассы"
              subtitle="Продажи, оформленные без сети, автоматически отправляются на сервер при подключении"
              action={
                <button className={btnPrimary} onClick={syncNow} disabled={saving}>
                  <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Синхронизировать сейчас
                </button>
              }
            />
            <div className="p-3 space-y-2">
              <div className={`p-3 rounded border text-xs ${localQueue.length ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <CloudOff className="w-4 h-4 inline mr-1" />
                Локальная очередь: <b>{localQueue.length}</b> операций. На сервере: <b>{offline.length}</b> записей.
              </div>
              {offline.length === 0 ? (
                <Empty>Офлайн-операций на сервере нет.</Empty>
              ) : (
                <div className="overflow-x-auto border border-[#e2e8f0] dark:border-slate-800 rounded">
                  <table className="excel-table text-left w-full">
                    <thead>
                      <tr>
                        <Th>ID транзакции</Th>
                        <Th>Статус</Th>
                        <Th>Ошибка</Th>
                        <Th>Создана</Th>
                        <Th right>Действия</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                      {offline.map((op) => (
                        <tr key={op.id}>
                          <Td className="font-mono text-[10px]">{op.clientTransactionId}</Td>
                          <Td><StatusBadge status={op.status} /></Td>
                          <Td className="max-w-[260px] text-[10px] text-rose-600">{op.error || '—'}</Td>
                          <Td>{formatDateTime(op.createdAt)}</Td>
                          <Td right>
                            <div className="flex items-center justify-end gap-1">
                              {op.status !== 'succeeded' && (
                                <button className={btnSecondary} onClick={async () => {
                                  try { await syncApi.retry(op.id); toast.success('Повтор выполнен'); loadOffline(); }
                                  catch (err) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
                                }}>Повторить</button>
                              )}
                              {op.status === 'failed' && (
                                <button className={btnDanger} onClick={async () => {
                                  try { await syncApi.remove(op.id); toast.success('Удалено'); loadOffline(); }
                                  catch (err) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
                                }}><Trash2 className="w-3 h-3" /></button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : tab === 'audit' ? (
          <>
            <SectionTitle
              title="Журнал действий сотрудников"
              subtitle="Все критичные операции: продажи, закупки, корректировки, настройки"
              action={
                <div className="flex items-center gap-2">
                  <input className={inputCls} placeholder="Поиск по действию или сотруднику..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
                  <button className={btnSecondary} onClick={loadAudit} title="Обновить"><History className="w-3.5 h-3.5" /></button>
                  <button className={btnDanger} onClick={clearAudit} disabled={audit.length === 0} title="Очистить журнал">
                    <Trash2 className="w-3.5 h-3.5" /> Очистить
                  </button>
                </div>
              }
            />
            {audit.length === 0 ? (
              <Empty>Записи отсутствуют.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="excel-table text-left w-full">
                  <thead>
                    <tr>
                      <Th>Дата</Th>
                      <Th>Сотрудник</Th>
                      <Th>Действие</Th>
                      <Th>Объект</Th>
                      <Th>ID</Th>
                      <Th>Детали</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                    {audit.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#f8fafc] dark:hover:bg-slate-800/50">
                        <Td>{formatDateTime(entry.createdAt)}</Td>
                        <Td>{entry.userName || '—'}</Td>
                        <Td><span className="font-mono text-[10px] font-semibold text-[#107c41]">{entry.action}</span></Td>
                        <Td>{entry.entity}</Td>
                        <Td>{String(entry.entityId || '—')}</Td>
                        <Td className="max-w-[320px] truncate text-[10px] text-[#64748b]">{String(entry.details || '—')}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </Card>

      <Modal
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title="Новый филиал"
        footer={
          <>
            <button className={btnSecondary} onClick={() => setBranchOpen(false)}>Отмена</button>
            <button className={btnPrimary} onClick={saveBranch} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Название *">
            <input className={inputCls} value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
          </Field>
          <Field label="Адрес">
            <input className={inputCls} value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
          </Field>
          <Field label="Телефон">
            <input className={inputCls} value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-300">
            <input type="checkbox" checked={branchForm.isMain} onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })} className="accent-[#107c41]" />
            Сделать основным филиалом
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;

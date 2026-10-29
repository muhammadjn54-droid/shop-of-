import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Search,
  Check,
  X,
  ExternalLink,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { calculateSalary } from '../utils/employees';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/employees';
import type { Employee } from '../types';

export const EmployeesPage = () => {
  const { lang } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states for Add
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [baseSalary, setBaseSalary] = useState('2000');
  const [hasRest, setHasRest] = useState(true);
  const [restDays, setRestDays] = useState('4');
  const [absentDays, setAbsentDays] = useState('0');

  // Edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editHasRest, setEditHasRest] = useState(true);
  const [editRestDays, setEditRestDays] = useState('');
  const [editAbsentDays, setEditAbsentDays] = useState('');

  const [loading, setLoading] = useState(true);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      if (data.length === 0) {
        const legacyRaw = localStorage.getItem('shop_employees_list');
        if (legacyRaw) {
          try {
            const localItems = JSON.parse(legacyRaw);
            if (Array.isArray(localItems) && localItems.length > 0) {
              for (const emp of localItems) {
                await createEmployee({
                  name: emp.name,
                  position: emp.position,
                  baseSalary: emp.baseSalary,
                  hasRest: emp.hasRest,
                  restDays: emp.restDays,
                  absentDays: emp.absentDays,
                });
              }
              localStorage.removeItem('shop_employees_list');
              const reloaded = await getEmployees();
              setEmployees(reloaded);
              return;
            }
          } catch {
            // ignore
          }
        }
      }
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
      toast.error(lang === 'tg' ? 'Хатогӣ ҳангоми боркунӣ аз сервер' : 'Ошибка загрузки с сервера');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Add Employee
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(lang === 'tg' ? 'Лутфан номи кормандро ворид кунед' : 'Введите имя сотрудника');
      return;
    }

    try {
      const created = await createEmployee({
        name: name.trim(),
        position: position.trim() || (lang === 'tg' ? 'Корманд' : 'Сотрудник'),
        baseSalary: Number(baseSalary) || 2000,
        hasRest,
        restDays: hasRest ? Number(restDays) || 4 : 0,
        absentDays: Number(absentDays) || 0,
      });

      setEmployees((prev) => [created, ...prev]);

      toast.success(
        lang === 'tg'
          ? `Корманд «${created.name}» бомуваффақият илова шуд`
          : `Сотрудник «${created.name}» успешно добавлен`
      );

      // Reset Form
      setName('');
      setPosition('');
      setBaseSalary('2000');
      setHasRest(true);
      setRestDays('4');
      setAbsentDays('0');
      setIsAddOpen(false);
    } catch (err) {
      console.error('Error creating employee:', err);
      toast.error('Ошибка при создании сотрудника');
    }
  };

  // Delete Employee
  const handleDelete = async (id: number, empName: string) => {
    if (
      window.confirm(
        lang === 'tg'
          ? `Шумо дар ҳақиқат мехоҳед корманд «${empName}»-ро нест кунед?`
          : `Вы действительно хотите удалить сотрудника «${empName}»?`
      )
    ) {
      try {
        await deleteEmployee(id);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        toast.success(
          lang === 'tg'
            ? `Корманд «${empName}» нест карда шуд`
            : `Сотрудник «${empName}» удален`
        );
      } catch (err) {
        console.error('Error deleting employee:', err);
        toast.error('Ошибка при удалении сотрудника');
      }
    }
  };

  // Start Edit
  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditPosition(emp.position);
    setEditBaseSalary(String(emp.baseSalary));
    setEditHasRest(emp.hasRest);
    setEditRestDays(String(emp.restDays));
    setEditAbsentDays(String(emp.absentDays));
  };

  // Save Edit
  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      toast.error(lang === 'tg' ? 'Ном наметавонад холӣ бошад' : 'Имя не может быть пустым');
      return;
    }

    try {
      const updated = await updateEmployee(id, {
        name: editName.trim(),
        position: editPosition.trim() || (lang === 'tg' ? 'Корманд' : 'Сотрудник'),
        baseSalary: Number(editBaseSalary) || 0,
        hasRest: editHasRest,
        restDays: editHasRest ? Number(editRestDays) || 4 : 0,
        absentDays: Number(editAbsentDays) || 0,
      });

      setEmployees((prev) => prev.map((emp) => (emp.id === id ? updated : emp)));
      setEditingId(null);
      toast.success(lang === 'tg' ? 'Маълумот сабт шуд' : 'Изменения сохранены');
    } catch (err) {
      console.error('Error updating employee:', err);
      toast.error(lang === 'tg' ? 'Хатогӣ ҳангоми сабти тағйирот' : 'Ошибка при сохранении изменений');
    }
  };

  // Totals
  const totalBaseSalary = employees.reduce((acc, e) => acc + Number(e.baseSalary || 0), 0);
  const totalDeducted = employees.reduce(
    (acc, e) => acc + calculateSalary(e).deducted,
    0
  );
  const totalFinalPayout = employees.reduce(
    (acc, e) => acc + calculateSalary(e).finalSalary,
    0
  );

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#107c41]/10 dark:bg-emerald-950/60 border border-[#107c41]/30 flex items-center justify-center text-[#107c41] dark:text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#1e293b] dark:text-slate-100 flex items-center gap-2">
              {lang === 'tg' ? 'Идораи кормандон ва маош' : 'Учёт сотрудников и заработной платы'}
            </h1>
            <p className="text-xs text-[#64748b] dark:text-slate-400">
              {lang === 'tg'
                ? 'Ҳисоби худкори рӯзҳои корӣ, истироҳат, ғоибона ва маоши ниҳоӣ'
                : 'Автоматический расчёт рабочих дней, выходных, пропусков и итоговой зарплаты'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#107c41] hover:bg-[#0b5c30] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {isAddOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>
            {isAddOpen
              ? lang === 'tg'
                ? 'Пӯшидани форма'
                : 'Закрыть форму'
              : lang === 'tg'
              ? 'Иловаи корманд'
              : 'Добавить сотрудника'}
          </span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748b] dark:text-slate-400">
              {lang === 'tg' ? 'Шумораи кормандон' : 'Всего сотрудников'}
            </p>
            <p className="text-xl font-bold text-[#1e293b] dark:text-slate-100 mt-1">
              {employees.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                {lang === 'tg' ? 'нафар' : 'чел.'}
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Base Salary Fund */}
        <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748b] dark:text-slate-400">
              {lang === 'tg' ? 'Фонди умумии маош (Оклад)' : 'Фонд окладов'}
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {totalBaseSalary.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">сом.</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748b] dark:text-slate-400">
              {lang === 'tg' ? 'Ҳамагӣ ҷарима (Минус)' : 'Всего удержано (Штрафы)'}
            </p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{totalDeducted.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">сом.</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Total Net Payout */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              {lang === 'tg' ? 'Барои пардохт (Ниҳоӣ)' : 'К выплате (Чистая)'}
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalFinalPayout.toFixed(2)}{' '}
              <span className="text-xs font-semibold">сом.</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Add Form (Expandable) */}
      {isAddOpen && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-5 shadow-xs transition-all">
          <h2 className="text-sm font-bold text-[#1e293b] dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#107c41]" />
            {lang === 'tg' ? 'Формаи иловаи корманди нав' : 'Добавление нового сотрудника'}
          </h2>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'tg' ? 'Номи корманд*' : 'Имя сотрудника*'}
              </label>
              <input
                type="text"
                placeholder={lang === 'tg' ? 'Масалан: Фирӯз' : 'Например: Фируз'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'tg' ? 'Вазифа' : 'Должность'}
              </label>
              <input
                type="text"
                placeholder={lang === 'tg' ? 'Масалан: Фурӯшанда' : 'Например: Продавец'}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'tg' ? 'Маоши моҳона (сом)*' : 'Оклад в месяц (сом)*'}
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="2000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'tg' ? 'Тарзи кор' : 'График работы'}
              </label>
              <select
                value={hasRest ? 'rest' : 'norest'}
                onChange={(e) => setHasRest(e.target.value === 'rest')}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
              >
                <option value="rest">
                  {lang === 'tg' ? 'Бо истироҳат (4 рӯз)' : 'С выходными (4 дня)'}
                </option>
                <option value="norest">
                  {lang === 'tg' ? 'Бе истироҳат (ҳар рӯз)' : 'Без выходных (все дни)'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'tg' ? 'Рӯзҳои наомада' : 'Дней пропущено'}
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={absentDays}
                onChange={(e) => setAbsentDays(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#107c41] hover:bg-[#0b5c30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {lang === 'tg' ? '+ Илова кардан' : '+ Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        {/* Table Filter / Search bar */}
        <div className="p-4 border-b border-[#cbd5e1] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'tg' ? 'Ҷустуҷӯ аз рӯи ном ё вазифа...' : 'Поиск по имени или должности...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
            {lang === 'tg' ? `Ёфт шуд: ${filtered.length} нафар` : `Найдено: ${filtered.length}`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] dark:bg-slate-800/60 text-[#64748b] dark:text-slate-400 border-b border-[#cbd5e1] dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{lang === 'tg' ? 'Корманд' : 'Сотрудник'}</th>
                <th className="py-3 px-4">{lang === 'tg' ? 'Тарзи кор' : 'График'}</th>
                <th className="py-3 px-4">{lang === 'tg' ? 'Оклад (моҳ)' : 'Оклад'}</th>
                <th className="py-3 px-4">{lang === 'tg' ? 'Сари 1 рӯз' : 'В день'}</th>
                <th className="py-3 px-4">{lang === 'tg' ? 'Наомада (минус)' : 'Пропуски (штраф)'}</th>
                <th className="py-3 px-4">{lang === 'tg' ? 'Маоши ниҳоӣ' : 'К выплате'}</th>
                <th className="py-3 px-4 text-right">{lang === 'tg' ? 'Амалҳо' : 'Действия'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1] dark:divide-slate-800 text-[#1e293b] dark:text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    {lang === 'tg' ? 'Ҳоло корманд ёфт нашуд' : 'Сотрудники не найдены'}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isEditing = editingId === emp.id;
                  const calc = calculateSalary(emp);

                  if (isEditing) {
                    const previewCalc = calculateSalary({
                      ...emp,
                      baseSalary: Number(editBaseSalary) || 0,
                      hasRest: editHasRest,
                      restDays: editHasRest ? 4 : 0,
                      absentDays: Number(editAbsentDays) || 0,
                    });

                    return (
                      <tr key={emp.id} className="bg-blue-50/50 dark:bg-blue-950/20">
                        <td className="p-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-blue-300 dark:border-blue-700 p-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            placeholder="Ном"
                          />
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            className="w-full border border-blue-300 dark:border-blue-700 p-1.5 rounded-lg text-[11px] mt-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            placeholder="Вазифа"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={editHasRest ? 'rest' : 'norest'}
                            onChange={(e) => setEditHasRest(e.target.value === 'rest')}
                            className="border border-blue-300 dark:border-blue-700 p-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="rest">Бо истироҳат (4)</option>
                            <option value="norest">Бе истироҳат</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editBaseSalary}
                              onChange={(e) => setEditBaseSalary(e.target.value)}
                              className="w-20 border border-blue-300 dark:border-blue-700 p-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                            <span className="text-xs text-slate-400">сом.</span>
                          </div>
                        </td>
                        <td className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {previewCalc.dailyRate} сом.
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={editAbsentDays}
                              onChange={(e) => setEditAbsentDays(e.target.value)}
                              className="w-16 border border-blue-300 dark:border-blue-700 p-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                            {Number(editAbsentDays) > 0 ? (
                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                (-{previewCalc.deducted} сом.)
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 font-black text-sm text-[#107c41] dark:text-emerald-400">
                          {previewCalc.finalSalary} сом.
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(emp.id)}
                              className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
                              title="Сабт"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer transition-colors"
                              title="Бекор"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#f8fafc] dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Position */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#107c41]/10 dark:bg-emerald-950 text-[#107c41] dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-[#107c41]/20">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`/employees/${emp.id}`}
                              className="font-bold text-[#1e293b] dark:text-slate-100 hover:text-[#107c41] dark:hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                            >
                              <span>{emp.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                            </Link>
                            <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                              {emp.position}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Work Schedule */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.hasRest
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          {emp.hasRest
                            ? lang === 'tg'
                              ? 'Бо истироҳат (4)'
                              : 'Выходные (4)'
                            : lang === 'tg'
                            ? 'Бе истироҳат'
                            : 'Без выходных'}
                        </span>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-4 font-semibold text-[#1e293b] dark:text-slate-200">
                        {emp.baseSalary} сом.
                      </td>

                      {/* Daily Rate */}
                      <td className="py-3 px-4 text-[#64748b] dark:text-slate-400">
                        {calc.dailyRate} сом.
                      </td>

                      {/* Absent & Deductions */}
                      <td className="py-3 px-4">
                        {emp.absentDays > 0 ? (
                          <div className="text-rose-600 dark:text-rose-400 font-semibold">
                            <span>{emp.absentDays} рӯз</span>{' '}
                            <span className="text-[10px]">(-{calc.deducted} сом.)</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            0 (Бе ҷарима)
                          </span>
                        )}
                      </td>

                      {/* Final Payout */}
                      <td className="py-3 px-4 font-black text-sm text-[#107c41] dark:text-emerald-400">
                        {calc.finalSalary} сом.
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/employees/${emp.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors"
                            title={lang === 'tg' ? 'Инфо ва тафсилот' : 'Подробно'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => startEdit(emp)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                            title={lang === 'tg' ? 'Иваз кардан' : 'Редактировать'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                            title={lang === 'tg' ? 'Нест кардан' : 'Удалить'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;

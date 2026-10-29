import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  Users,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { calculateSalary } from '../utils/employees';
import { getEmployee, updateEmployee } from '../api/employees';
import type { Employee } from '../types';

export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [absentInput, setAbsentInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEmployee(Number(id))
      .then((found) => {
        setEmployee(found);
        setAbsentInput(String(found.absentDays));
      })
      .catch((err) => {
        console.error('Failed to load employee detail:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleUpdateAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const newAbsent = Number(absentInput) || 0;
    try {
      const updated = await updateEmployee(employee.id, { absentDays: newAbsent });
      setEmployee(updated);
      toast.success(
        lang === 'tg'
          ? 'Рӯзҳои наомада нав карда шуданд'
          : 'Количество пропусков обновлено'
      );
    } catch {
      toast.error('Ошибка при обновлении пропусков');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Боргирӣ шуда истодааст...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          {lang === 'tg' ? 'Корманд ёфт нашуд' : 'Сотрудник не найден'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {lang === 'tg'
            ? 'Шояд ин корманд қаблан нест карда шуда бошад.'
            : 'Возможно, сотрудник был ранее удален.'}
        </p>
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#107c41] text-white rounded-lg text-xs font-semibold hover:bg-[#0b5c30] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'tg' ? 'Бозгашт ба рӯйхат' : 'Вернуться к списку'}</span>
        </Link>
      </div>
    );
  }

  const calc = calculateSalary(employee);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#107c41] dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {lang === 'tg'
              ? 'Бозгашт ба рӯйхати кормандон'
              : 'Вернуться к списку сотрудников'}
          </span>
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#107c41]/10 dark:bg-emerald-950 text-[#107c41] dark:text-emerald-400 font-black text-2xl flex items-center justify-center border border-[#107c41]/30 shrink-0">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[#1e293b] dark:text-slate-100">
                {employee.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                Фаъол
              </span>
            </div>
            <p className="text-xs text-[#64748b] dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{employee.position}</span>
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  employee.hasRest
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {employee.hasRest
                  ? lang === 'tg'
                    ? 'График: Бо истироҳат (4 рӯз)'
                    : 'График: С выходными (4 дня)'
                  : lang === 'tg'
                  ? 'График: Бе истироҳат (ҳар рӯз)'
                  : 'График: Без выходных'}
              </span>
            </div>
          </div>
        </div>

        {/* Big Final Payout Badge */}
        <div className="sm:text-right bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
            {lang === 'tg' ? 'Маоши ниҳоӣ барои пардохт' : 'Итого к выплате'}
          </p>
          <p className="text-2xl md:text-3xl font-black text-[#107c41] dark:text-emerald-400 mt-0.5">
            {calc.finalSalary}{' '}
            <span className="text-sm font-semibold">сомонӣ</span>
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'tg' ? 'Пас аз тарҳи ҷаримаҳо' : 'С учётом всех вычетов'}
          </p>
        </div>
      </div>

      {/* Detailed Financial Calculation Grid */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
        <h2 className="text-sm font-bold text-[#1e293b] dark:text-slate-100 border-b border-[#cbd5e1] dark:border-slate-800 pb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#107c41]" />
          <span>
            {lang === 'tg'
              ? 'Таҳлили муфассали молиявӣ ва табел'
              : 'Подробный финансовый расчёт и табель'}
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Base Salary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-slate-500 dark:text-slate-400">
              {lang === 'tg' ? 'Маоши моҳона (Оклад)' : 'Базовый оклад'}
            </p>
            <p className="text-lg font-bold text-[#1e293b] dark:text-slate-100 mt-1">
              {employee.baseSalary} сомонӣ
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'tg' ? 'Маоши пурраи шартномавӣ' : 'Полный месячный оклад'}
            </p>
          </div>

          {/* Working Days */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-slate-500 dark:text-slate-400">
              {lang === 'tg' ? 'Рӯзҳои корӣ дар моҳ' : 'Рабочих дней в месяце'}
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
              {calc.workingDays} рӯз
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {employee.hasRest
                ? lang === 'tg'
                  ? '30 рӯз - 4 рӯзи истироҳат'
                  : '30 дней - 4 выходных'
                : lang === 'tg'
                ? 'Тамоми 30 рӯз бе истироҳат'
                : 'Все 30 дней без выходных'}
            </p>
          </div>

          {/* Daily Rate */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-slate-500 dark:text-slate-400">
              {lang === 'tg' ? 'Нархи 1 рӯзи корӣ' : 'Стоимость 1 рабочего дня'}
            </p>
            <p className="text-lg font-bold text-[#107c41] dark:text-emerald-400 mt-1">
              {calc.dailyRate} сомонӣ
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {employee.baseSalary} / {calc.workingDays}
            </p>
          </div>

          {/* Actually Worked Days */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-slate-500 dark:text-slate-400">
              {lang === 'tg' ? 'Рӯзҳои омада кор карда' : 'Фактически отработано'}
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {calc.workedDays} рӯз
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {calc.workingDays} - {employee.absentDays} рӯз
            </p>
          </div>

          {/* Absent Days */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/60">
            <p className="text-rose-600 dark:text-rose-400 font-semibold">
              {lang === 'tg' ? 'Рӯзҳои наомада (ғоиб)' : 'Пропущено дней'}
            </p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
              {employee.absentDays} рӯз
            </p>
            <p className="text-[10px] text-rose-400 mt-0.5">
              {lang === 'tg' ? 'Ғоибона бе сабаб' : 'Без уважительной причины'}
            </p>
          </div>

          {/* Deducted Amount */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/60">
            <p className="text-rose-600 dark:text-rose-400 font-semibold">
              {lang === 'tg' ? 'Маблағи ҷарима (Минус)' : 'Сумма штрафа (Удержано)'}
            </p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
              -{calc.deducted} сомонӣ
            </p>
            <p className="text-[10px] text-rose-400 mt-0.5">
              {employee.absentDays} × {calc.dailyRate} сом.
            </p>
          </div>
        </div>

        {/* Quick Absent Days Form */}
        <div className="pt-4 border-t border-[#cbd5e1] dark:border-slate-800">
          <h3 className="text-xs font-bold text-[#1e293b] dark:text-slate-100 mb-2 flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5 text-[#107c41]" />
            <span>
              {lang === 'tg'
                ? 'Тағйир додани рӯзҳои наомада ва ҳисобкунии нав:'
                : 'Изменить количество пропущенных дней:'}
            </span>
          </h3>

          <form onSubmit={handleUpdateAbsent} className="flex items-center gap-3 max-w-sm">
            <input
              type="number"
              min="0"
              max="30"
              value={absentInput}
              onChange={(e) => setAbsentInput(e.target.value)}
              className="w-28 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#107c41]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#107c41] hover:bg-[#0b5c30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {lang === 'tg' ? 'Ҳисоб кардан' : 'Пересчитать'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;

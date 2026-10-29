import type { CategoryItem, ProductCategory } from '../types';

export const PRODUCT_CATEGORIES: CategoryItem[] = [
  {
    id: 'stationery',
    labelTg: 'Конставар',
    labelRu: 'Канцтовары',
    labelEn: 'Stationery',
    icon: '✏️',
    descriptionTg: 'Дафтарҳо, ручкаҳо, қалам ва лавозимоти хониш',
    descriptionRu: 'Тетради, ручки, бумага и школьные принадлежности',
  },
  {
    id: 'toys',
    labelTg: 'Игрушка',
    labelRu: 'Игрушки',
    labelEn: 'Toys',
    icon: '🧸',
    descriptionTg: 'Бозичаҳои бачагона, моделҳо, бозиҳо',
    descriptionRu: 'Детские игрушки, развивающие игры',
  },
  {
    id: 'perfumery',
    labelTg: 'Порфимерия',
    labelRu: 'Парфюмерия',
    labelEn: 'Perfumery',
    icon: '🧴',
    descriptionTg: 'Атр, хушбӯйкунандаҳо, косметика',
    descriptionRu: 'Духи, парфюмерия, косметика',
  },
  {
    id: 'accessories',
    labelTg: 'Зарядмонакҳо',
    labelRu: 'Зарядники и аксессуары',
    labelEn: 'Accessories & Chargers',
    icon: '🔌',
    descriptionTg: 'Наушникҳо, зарядмонакҳо, кабелҳо ва ғайра',
    descriptionRu: 'Наушники, зарядные устройства, кабели и прочее',
  },
];

export const getCategoryMeta = (categoryId?: string, lang: 'tg' | 'ru' | 'en' = 'ru') => {
  const found = PRODUCT_CATEGORIES.find(
    (c) => c.id === (categoryId || '').toLowerCase().trim()
  );

  if (found) {
    const label =
      lang === 'tg'
        ? found.labelTg
        : lang === 'en'
        ? found.labelEn
        : found.labelRu;
    return {
      id: found.id,
      label,
      icon: found.icon,
      colorClass:
        found.id === 'stationery'
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          : found.id === 'toys'
          ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800'
          : found.id === 'perfumery'
          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }

  // Fallback default
  const defaultItem = PRODUCT_CATEGORIES[0];
  return {
    id: 'stationery' as ProductCategory,
    label: lang === 'tg' ? defaultItem.labelTg : defaultItem.labelRu,
    icon: defaultItem.icon,
    colorClass:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
};

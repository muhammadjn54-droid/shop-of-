import { useState } from 'react';
import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Monitor,
  Smartphone,
  Apple,
  X,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

export const InstallAppModal = () => {
  const { isModalOpen, closeModal, installApp, isInstalled, markAsInstalled } = usePwa();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pc' | 'android' | 'ios'>('pc');

  if (!isModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#107c41] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shadow-inner">
              <Download className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {lang === 'tg'
                  ? 'Насби барномаи Excel Pro'
                  : lang === 'ru'
                  ? 'Установка программы Excel Pro'
                  : 'Install Excel Pro App'}
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {lang === 'tg'
                  ? 'Дар компютер ё телефон ҳамчун барнома кор кунед'
                  : lang === 'ru'
                  ? 'Работайте на компьютере и телефоне как в отдельной программе'
                  : 'Use as a standalone application on PC or mobile'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main Action Button */}
          {!isInstalled ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-left">
                <Sparkles className="w-5 h-5 text-[#107c41] dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {lang === 'tg' ? 'Насби фаврӣ' : lang === 'ru' ? 'Быстрая установка' : 'Quick Install'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {lang === 'tg'
                      ? 'Барои пайдо шудани равзана тугмаро пахш кунед'
                      : lang === 'ru'
                      ? 'Нажмите для запуска окна установки в браузере'
                      : 'Click to trigger browser install dialog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={installApp}
                className="w-full sm:w-auto px-4 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {lang === 'tg'
                    ? 'Ҳозир насб кардан'
                    : lang === 'ru'
                    ? 'Установить сейчас'
                    : 'Install Now'}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'tg'
                  ? 'Барнома аллакай насб шудааст!'
                  : lang === 'ru'
                  ? 'Программа уже установлена на этом устройстве!'
                  : 'App is already installed on this device!'}
              </span>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'tg'
                ? 'Дастурамал барои дастгоҳи шумо:'
                : lang === 'ru'
                ? 'Инструкция для вашего устройства:'
                : 'Instructions for your device:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pc')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'pc'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows / PC</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>
          </div>

          {/* Tab Explanations */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
            {activeTab === 'pc' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Дар браузери Chrome ё Edge дар тарафи рости сатри суроғаҳо (дар боло) тугмаи «Насб кардан» (Install)-ро пахш кунед.'
                      : lang === 'ru'
                      ? 'В браузере Chrome или Edge в правой части адресной строки (вверху) нажмите значок монитора «Установить».'
                      : 'In Chrome or Edge, click the "Install" computer icon on the right side of the URL address bar.'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Ё менюи се нуқта (...) ➔ «Насби барнома»-ро интихоб кунед.'
                      : lang === 'ru'
                      ? 'Либо откройте меню (три точки) ➔ «Установить приложение».'
                      : 'Or open the three dots menu ➔ "Install App".'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Дар мизи кории Windows (Рабочий стол) нишона пайдо шуда, барнома бе браузер кушода мешавад!'
                      : lang === 'ru'
                      ? 'На Рабочем столе появится ярлык, и программа будет запускаться в отдельном чистом окне как настоящий софт для кассы!'
                      : 'A desktop shortcut will be created, running the app in a clean standalone window without browser UI!'}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'android' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Дар телефони Android браузери Chrome-ро кушоед ва тугмаи се нуқтаро дар кунҷи боло пахш кунед.'
                      : lang === 'ru'
                      ? 'В браузере Chrome на телефоне нажмите меню (три точки в правом верхнем углу).'
                      : 'In mobile Chrome, tap the three dots menu in the top right corner.'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Банди «Насб кардани барнома» ё «Илова ба экрани асосӣ»-ро интихоб кунед.'
                      : lang === 'ru'
                      ? 'Выберите «Установить приложение» или «Добавить на главный экран».'
                      : 'Select "Install app" or "Add to Home Screen".'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Барнома ба рӯйхати барномаҳои телефонатон илова мегардад ва мисли барномаи оддӣ кор мекунад.'
                      : lang === 'ru'
                      ? 'Значок появится на экране телефона среди остальных приложений и будет работать во весь экран.'
                      : 'The app icon appears on your home screen and operates as a native mobile app.'}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'ios' && (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="flex items-center gap-1.5">
                    <p>
                      {lang === 'tg'
                        ? 'Дар Safari тугмаи «Ба дигарон фиристодан» (Share)'
                        : lang === 'ru'
                        ? 'В Safari внизу экрана нажмите кнопку «Поделиться»'
                        : 'In Safari, tap the Share button'}
                    </p>
                    <Share className="w-3.5 h-3.5 text-blue-500 inline" />
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="flex items-center gap-1.5">
                    <p>
                      {lang === 'tg'
                        ? 'Ба поён ҳаракат карда, банди «Ба экрани асосӣ» (На экран Домой)-ро интихоб намоед.'
                        : lang === 'ru'
                        ? 'Пролистайте вниз и выберите «На экран «Домой»»'
                        : 'Scroll down and tap "Add to Home Screen"'}
                    </p>
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 inline" />
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#107c41] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    {lang === 'tg'
                      ? 'Тугмаи «Илова кардан» (Add)-ро пахш кунед. Тамом!'
                      : lang === 'ru'
                      ? 'Нажмите «Добавить» в правом верхнем углу. Готово!'
                      : 'Tap "Add" in the top right corner. All set!'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          {!isInstalled ? (
            <button
              type="button"
              onClick={markAsInstalled}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {lang === 'tg'
                ? '✓ Ман аллакай насб кардам (тугмаро пинҳон кун)'
                : lang === 'ru'
                ? '✓ Я уже установил (скрыть кнопку «Скачать»)'
                : '✓ Already installed (hide button)'}
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={closeModal}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {lang === 'tg' ? 'Фаҳмо' : lang === 'ru' ? 'Понятно' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

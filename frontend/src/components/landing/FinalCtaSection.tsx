import { Link } from 'react-router';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Reveal from './Reveal';

export const FinalCtaSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] bg-[#0b4f2f] px-6 py-12 shadow-[0_30px_70px_-40px_rgba(11,79,47,0.8)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
              aria-hidden="true"
            />
            <FileSpreadsheet
              className="pointer-events-none absolute -bottom-10 -right-6 h-52 w-52 text-white/5 sm:h-64 sm:w-64"
              aria-hidden="true"
            />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-14">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-200 sm:text-[11px]">
                  {t('lpCtaEyebrow')}
                </p>
                <h2 className="mt-4 text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.35rem]">
                  {t('lpCtaTitle')}
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-emerald-50/75 sm:text-[15px]">
                  {t('lpCtaDesc')}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-6 py-3.5 text-sm font-semibold text-[#0b4f2f] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#ecfdf5] active:translate-y-0"
                >
                  {t('lpCtaPrimary')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t('lpCtaLogin')}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FinalCtaSection;

import { Link } from 'react-router';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import ProductPreview from './ProductPreview';
import MouseParallax from './MouseParallax';

export const HeroSection = () => {
  const { t } = useLanguage();

  const points = [
    t('lpHeroPointProducts'),
    t('lpHeroPointSales'),
    t('lpHeroPointReports'),
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const previewVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      },
    },
  };

  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 landing-grid-bg opacity-80" aria-hidden="true" />
      <motion.div
        className="pointer-events-none absolute right-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-[var(--lp-emerald)] opacity-[0.07] blur-3xl"
        aria-hidden="true"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.07, 0.09, 0.07],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-30%] left-[-14%] h-[420px] w-[420px] rounded-full bg-[var(--lp-amber)] opacity-[0.06] blur-3xl"
        aria-hidden="true"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.06, 0.08, 0.06],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-16">
          <motion.div
            className="max-w-xl lg:max-w-none"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]"
              variants={itemVariants}
            >
              <motion.span
                className="h-px w-7 bg-[var(--lp-emerald)]"
                aria-hidden="true"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              {t('lpHeroEyebrow')}
            </motion.p>

            <motion.h1
              className="mt-5 text-balance text-[2.15rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--lp-ink)] sm:text-[2.9rem] lg:text-[3.4rem] xl:text-[3.65rem]"
              variants={itemVariants}
            >
              {t('lpHeroTitle')}
            </motion.h1>

            <motion.p
              className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-[var(--lp-muted)] sm:text-[17px] sm:leading-8"
              variants={itemVariants}
            >
              {t('lpHeroDesc')}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              variants={itemVariants}
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--lp-emerald-solid)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(16,124,65,0.65)] transition-all hover:-translate-y-1 hover:bg-[var(--lp-emerald-solid-hover)] hover:shadow-[0_18px_40px_-12px_rgba(16,124,65,0.75)] active:translate-y-0"
              >
                {t('lpHeroPrimary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href="#product-preview"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-[var(--lp-line-strong)] bg-[var(--lp-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--lp-ink)] shadow-[var(--lp-shadow-sm)] transition-all hover:-translate-y-1 hover:border-[var(--lp-emerald-bright)] hover:bg-[var(--lp-surface-alt)] hover:shadow-[var(--lp-shadow-md)] active:translate-y-0"
              >
                {t('lpHeroSecondary')}
                <ArrowDown className="h-4 w-4 text-[var(--lp-muted)] transition-transform group-hover:translate-y-1" aria-hidden="true" />
              </a>
            </motion.div>

            <motion.ul
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5"
              variants={containerVariants}
            >
              {points.map((point) => (
                <motion.li
                  key={point}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--lp-ink-soft)]"
                  variants={itemVariants}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--lp-emerald-tint)] text-[var(--lp-emerald)]">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            className="landing-preview-enter mx-auto w-full max-w-[620px] lg:max-w-none"
            variants={previewVariants}
            initial="hidden"
            animate="visible"
          >
            <MouseParallax intensity={8}>
              <div className="relative">
                <div
                  className="absolute -inset-x-6 -top-6 bottom-0 rounded-[40px] bg-gradient-to-b from-[var(--lp-emerald)]/10 to-transparent blur-3xl"
                  aria-hidden="true"
                />
                <ProductPreview compact />
              </div>
            </MouseParallax>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

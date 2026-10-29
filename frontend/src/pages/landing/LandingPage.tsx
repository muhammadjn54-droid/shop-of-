import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LandingNav from '../../components/landing/LandingNav';
import HeroSection from '../../components/landing/HeroSection';
import ShowcaseSection from '../../components/landing/ShowcaseSection';
import ProblemSection from '../../components/landing/ProblemSection';
import FeaturesSection from '../../components/landing/FeaturesSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import BenefitsSection from '../../components/landing/BenefitsSection';
import FaqAccordion from '../../components/landing/FaqAccordion';
import FinalCtaSection from '../../components/landing/FinalCtaSection';
import LandingFooter from '../../components/landing/LandingFooter';

export const LandingPage = () => {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.documentElement.classList.add('landing-smooth-scroll');
    return () => document.documentElement.classList.remove('landing-smooth-scroll');
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${t('appName')} — ${t('lpShowcaseTitle')}`;
    return () => {
      document.title = previousTitle;
    };
  }, [lang, t]);

  return (
    <div className="landing-shell min-h-screen overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--lp-emerald-solid)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t('lpSkipToContent')}
      </a>

      <LandingNav />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <ShowcaseSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FaqAccordion />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;

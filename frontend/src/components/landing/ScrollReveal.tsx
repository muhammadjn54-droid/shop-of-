import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  threshold?: number;
}

export const ScrollReveal = ({ 
  children, 
  className = '', 
  direction = 'up', 
  delay = 0,
  threshold = 0.15
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(node);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const getClass = () => {
    switch (direction) {
      case 'left':
        return 'landing-reveal-left';
      case 'right':
        return 'landing-reveal-right';
      case 'scale':
        return 'landing-reveal-scale';
      case 'fade':
        return 'landing-reveal';
      case 'up':
      default:
        return 'landing-reveal';
    }
  };

  return (
    <div
      ref={ref}
      className={`${getClass()} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;

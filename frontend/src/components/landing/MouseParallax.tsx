import { useEffect, useRef, type ReactNode } from 'react';

interface MouseParallaxProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export const MouseParallax = ({ children, className = '', intensity = 10 }: MouseParallaxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (reducedMotion || isTouch) return;

    let rafId: number;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = ((e.clientX - centerX) / rect.width) * intensity;
      targetY = ((e.clientY - centerY) / rect.height) * intensity;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      content.style.transform = `perspective(1000px) rotateY(${currentX}deg) rotateX(${-currentY}deg) translateZ(0)`;
      rafId = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
      if (content) content.style.transform = '';
    };
  }, [intensity]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div ref={contentRef} className="will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
};

export default MouseParallax;

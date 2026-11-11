import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delayMs = 0,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    );
  });

  useEffect(() => {
    if (revealed || !ref.current) return;
    const el = ref.current;

    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.96) {
        setRevealed(true);
        return true;
      }
      return false;
    };

    if (checkPosition()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight * 0.96) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 40px 0px' },
    );

    const onScroll = () => {
      if (checkPosition()) {
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
      }
    };

    observer.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [revealed]);

  return (
    <div
      ref={ref}
      data-scroll-revealed={revealed ? 'true' : 'false'}
      style={{
        transitionDelay: `${Math.min(delayMs, 80)}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-[opacity,transform] duration-350 will-change-transform ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-3'
      } ${className}`}
    >
      {children}
    </div>
  );
};

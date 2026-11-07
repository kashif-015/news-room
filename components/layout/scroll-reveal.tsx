'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export function ScrollReveal({ children, className = '', delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, delayMs);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(8px)',
        transition: 'opacity 280ms cubic-bezier(0.2, 0.7, 0.2, 1), transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1)',
      }}
      className={className}
    >
      {children}
    </div>
  );
}


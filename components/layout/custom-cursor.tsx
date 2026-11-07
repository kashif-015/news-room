'use client';

import React, { useEffect, useState, useRef } from 'react';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only enable if pointer: fine and not reduced motion
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!finePointer || reducedMotion) return;
    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };

      // Check hovered element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
      const storyRow = target.closest('[data-cursor-label]');

      if (storyRow) {
        setCursorText(storyRow.getAttribute('data-cursor-label') || 'Read');
        setIsHovered(true);
      } else if (interactive) {
        setCursorText('');
        setIsHovered(true);
      } else {
        setCursorText('');
        setIsHovered(false);
      }
    };

    let animationId: number;
    const render = () => {
      // Lerp ring towards cursor position
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animationId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Small ink dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-ink pointer-events-none z-[9999] transition-opacity duration-150"
        aria-hidden="true"
      />

      {/* Trailing ring / label badge */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center transition-all duration-200 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] ${
          cursorText
            ? '-ml-5 -mt-3.5 px-2 py-0.5 rounded-[2px] bg-orange text-paper font-mono text-[10px] tracking-wider uppercase'
            : isHovered
            ? '-ml-3.5 -mt-3.5 w-7 h-7 rounded-full border border-orange bg-orange-wash/30 scale-110'
            : '-ml-2 -mt-2 w-4 h-4 rounded-full border border-ink-mute/40 opacity-50'
        }`}
        aria-hidden="true"
      >
        {cursorText}
      </div>
    </>
  );
}


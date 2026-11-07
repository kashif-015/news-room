'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, FileText, Palette, Rss, BarChart3, Radio } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Feed', icon: Newspaper },
  { href: '/drafts', label: 'Drafts', icon: FileText },
  { href: '/style', label: 'Style', icon: Palette },
  { href: '/sources', label: 'Sources', icon: Rss },
  { href: '/wire', label: 'Wire', icon: Radio },
  { href: '/log', label: 'Log', icon: BarChart3 },
];

export function NavRail() {
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Vertical Rail (72px) */}
      <aside
        className="hidden md:flex fixed top-0 left-0 bottom-0 w-[72px] bg-paper border-r border-rule flex-col items-center py-6 z-40"
        aria-label="Main Navigation"
      >
        {/* Brand / Monogram */}
        <Link
          href="/"
          className="mb-8 font-fraunces font-bold text-xl text-ink tracking-tight flex items-center justify-center w-10 h-10 border border-rule rounded-[2px] bg-bone hover:border-orange transition-colors"
          title="NewsDesk"
        >
          ND
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-5 w-full items-center">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isCurrent(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-[2px] transition-all duration-150 ${
                  active
                    ? 'text-orange bg-bone-deep/50'
                    : 'text-ink-mute hover:text-ink hover:bg-bone-deep/30'
                }`}
                title={label}
              >
                {/* Active Indicator on left border of rail */}
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[3px] bg-orange rounded-r-xs"
                    aria-hidden="true"
                  />
                )}
                <Icon strokeWidth={1.5} className="w-5 h-5 mb-1" />
                <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Edition number stamp at bottom */}
        <div className="font-mono text-[10px] text-ink-mute text-center select-none pt-4 border-t border-rule w-10">
          ED.304
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper border-t border-rule flex items-center justify-around z-40 px-2"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isCurrent(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 transition-colors ${
                active ? 'text-orange font-medium' : 'text-ink-mute hover:text-ink'
              }`}
            >
              <Icon strokeWidth={1.5} className="w-5 h-5" />
              <span className="font-mono text-[10px] uppercase tracking-wider mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}


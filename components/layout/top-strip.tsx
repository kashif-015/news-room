'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Search } from 'lucide-react';

interface TopStripProps {
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopStrip({ lastUpdated, onRefresh, isRefreshing }: TopStripProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    // Current date in newspaper dateline format
    const now = new Date();
    const formatted = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    // Calculate running edition number (days since Jan 1, 2026 for example)
    const epoch = new Date('2026-01-01').getTime();
    const editionDays = Math.max(1, Math.floor((now.getTime() - epoch) / (1000 * 60 * 60 * 24)));
    setCurrentDateStr(`${formatted} · Edition ${editionDays}`);

    // Load saved theme
    const saved = localStorage.getItem('newsdesk-theme') as 'light' | 'dark';
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('news-search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          router.push('/?search=true');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('newsdesk-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <header className="w-full border-b border-rule bg-bone/80 backdrop-blur-xs sticky top-0 z-30 px-4 md:px-8 py-2 flex items-center justify-between font-mono text-xs text-ink-mute">
      {/* Left: Dateline */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-ink-soft">{currentDateStr || 'Loading dateline...'}</span>
      </div>

      {/* Right: Search, Refresh Status, Theme toggle, Logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const input = document.getElementById('news-search-input') as HTMLInputElement | null;
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              router.push('/?search=true');
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-rule bg-paper hover:border-ink-soft text-ink-soft hover:text-ink transition-colors cursor-pointer"
          title="Search news across sources"
          aria-label="Search news"
        >
          <Search className="w-3.5 h-3.5 text-ink-mute" />
          <span className="hidden sm:inline font-mono text-[11px]">Search news...</span>
        </button>

        {lastUpdated && (
          <span className="hidden sm:inline text-ink-mute">
            {isRefreshing ? 'Refreshing feed...' : `Updated ${lastUpdated}`}
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hover:text-ink text-orange underline underline-offset-2 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
        )}

        <div className="h-3 w-[1px] bg-rule" aria-hidden="true" />

        <button
          onClick={toggleTheme}
          className="bg-transparent border-0 cursor-pointer hover:text-ink text-ink-mute transition-colors p-1 flex items-center justify-center rounded-[2px]"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon strokeWidth={1.5} className="w-3.5 h-3.5" />
          ) : (
            <Sun strokeWidth={1.5} className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleLogout}
          className="bg-transparent border-0 cursor-pointer hover:text-alert text-ink-mute transition-colors p-1 flex items-center gap-1 rounded-[2px]"
          title="Sign out of NewsDesk"
          aria-label="Sign out"
        >
          <LogOut strokeWidth={1.5} className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}


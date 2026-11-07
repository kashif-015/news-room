'use client';

import React, { type ReactNode } from 'react';
import { NavRail } from './nav-rail';
import { TopStrip } from './top-strip';
import { CustomCursor } from './custom-cursor';
import { ToastProvider } from '@/components/ui/toast';

interface AppShellProps {
  children: ReactNode;
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AppShell({ children, lastUpdated, onRefresh, isRefreshing }: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-bone text-ink flex flex-col selection:bg-orange-wash selection:text-ink">
        <CustomCursor />
        {/* Navigation Rail (Desktop) / Bottom Bar (Mobile) */}
        <NavRail />

        {/* Main Content Area (Offset 72px on desktop for vertical rail) */}
        <div className="flex-1 flex flex-col md:pl-[72px] pb-20 md:pb-6">
          <TopStrip
            lastUpdated={lastUpdated}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}


'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-rule/40 rounded-[2px] animate-pulse motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

export function StoryRowSkeleton() {
  return (
    <div className="py-4 space-y-2">
      <div className="flex gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}


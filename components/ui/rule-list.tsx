'use client';

import React, { type ReactNode } from 'react';

export interface RuleListProps {
  children: ReactNode;
  className?: string;
  as?: 'ul' | 'ol' | 'div';
}

export function RuleList({ children, className = '', as: Component = 'ul' }: RuleListProps) {
  return (
    <Component className={`divide-y divide-rule border-y border-rule ${className}`}>
      {children}
    </Component>
  );
}

export interface RuleListItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  active?: boolean;
}

export function RuleListItem({
  children,
  className = '',
  onClick,
  interactive = false,
  active = false,
}: RuleListItemProps) {
  const isClickable = interactive || !!onClick;

  return (
    <li
      onClick={onClick}
      className={`group relative transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] ${
        isClickable ? 'cursor-pointer hover:bg-bone-deep/50' : ''
      } ${active ? 'bg-bone-deep/70' : ''} ${className}`}
    >
      {/* 2px orange indicator bar on left for hover/active */}
      {isClickable && (
        <span
          className={`absolute left-0 top-0 bottom-0 w-[2px] bg-orange transition-opacity duration-150 ${
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
      <div className={`transition-transform duration-150 ${isClickable ? 'group-hover:translate-x-0.5' : ''}`}>
        {children}
      </div>
    </li>
  );
}


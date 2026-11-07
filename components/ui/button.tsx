'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-orange text-paper hover:bg-orange-deep active:bg-orange-deep',
  secondary: 'bg-transparent text-ink border border-ink hover:bg-bone-deep active:bg-bone-deep',
  tertiary:
    'bg-transparent text-orange underline-offset-[3px] decoration-2 decoration-transparent hover:decoration-orange hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-sm gap-2',
  small: 'h-8 px-3 text-xs gap-1.5',
};

const baseClasses = [
  'inline-flex items-center justify-center',
  'rounded-[4px]',
  'font-mono font-medium leading-none whitespace-nowrap',
  'transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]',
  'outline-none focus-visible:outline-2 focus-visible:outline-orange focus-visible:outline-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'select-none cursor-pointer',
].join(' ');

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'default',
    loading = false,
    disabled = false,
    leadingIcon,
    trailingIcon,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={classes}
      {...rest}
    >
      {loading ? (
        <Spinner className="shrink-0" />
      ) : leadingIcon ? (
        <span className="shrink-0 flex items-center" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}

      {children && <span>{children}</span>}

      {!loading && trailingIcon && (
        <span className="shrink-0 flex items-center" aria-hidden="true">
          {trailingIcon}
        </span>
      )}

      {loading && <span className="sr-only">Loading</span>}
    </button>
  );
});

export default Button;

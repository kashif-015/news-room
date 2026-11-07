'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Label text displayed inside the chip */
  label: string
  /** Whether the chip is in an active/selected state */
  active?: boolean
  /** Optional count badge rendered after the label */
  count?: number
  /** Optional icon or element rendered before the label */
  leadingIcon?: ReactNode
  /** Click handler for filter toggling */
  onClick?: () => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Chip — a rectangular filter token with mono typography.
 *
 * - Active: ink background, bone text, orange left-border marker.
 * - Inactive: transparent bg, rule border, ink text; hover → bone-deep bg.
 * - 2 px border-radius (design-token `rounded-sm` mapped to 2 px).
 * - Keyboard-accessible via semantic `<button>`.
 */
const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      label,
      active = false,
      count,
      leadingIcon,
      className = '',
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={
          count !== undefined ? `${label} (${count})` : label
        }
        disabled={disabled}
        className={[
          /* ---- layout ---- */
          'inline-flex items-center gap-1.5',
          'px-2.5 py-1',
          'rounded-[2px]',
          'border',

          /* ---- typography ---- */
          'font-mono text-xs uppercase tracking-wider leading-none',
          'select-none whitespace-nowrap',

          /* ---- transition ---- */
          'transition-all duration-150',
          '[transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]',

          /* ---- focus ring ---- */
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange',

          /* ---- state: active ---- */
          active && [
            'bg-ink text-bone border-ink',
            'border-l-[3px] border-l-orange',        // orange left-marker
          ],

          /* ---- state: inactive ---- */
          !active && [
            'bg-transparent text-ink border-rule',
            'hover:bg-bone-deep',
          ],

          /* ---- disabled ---- */
          disabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          !disabled && 'cursor-pointer',

          className,
        ]
          .flat()
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {/* Leading icon */}
        {leadingIcon && (
          <span className="flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3" aria-hidden="true">
            {leadingIcon}
          </span>
        )}

        {/* Label */}
        <span>{label}</span>

        {/* Count badge */}
        {count !== undefined && (
          <span
            aria-hidden="true"
            className={[
              'inline-flex items-center justify-center',
              'min-w-[1.125rem] h-[1.125rem] px-1',
              'rounded-[2px]',
              'font-mono text-[10px] leading-none tabular-nums',
              active
                ? 'bg-orange text-bone'
                : 'bg-bone-deep text-ink-soft',
              'transition-colors duration-150',
              '[transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]',
            ].join(' ')}
          >
            {count}
          </span>
        )}
      </button>
    )
  },
)

Chip.displayName = 'Chip'

export { Chip }
export default Chip

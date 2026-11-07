'use client';

import * as React from 'react';

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

interface FieldWrapperProps {
  /** Visible label rendered above the field (always shown, never placeholder-only). */
  label?: string;
  /** Optional helper text rendered below the field. */
  helperText?: string;
  /** Error message – when truthy the field enters an error state. */
  error?: string;
  /** HTML id to tie the label to its field via `htmlFor`. */
  htmlFor?: string;
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  FieldWrapper – shared label / helper / error chrome                */
/* ------------------------------------------------------------------ */

function FieldWrapper({
  label,
  helperText,
  error,
  htmlFor,
  children,
}: FieldWrapperProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const helperId = htmlFor ? `${htmlFor}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-mono uppercase tracking-wider text-xs text-ink-mute select-none"
        >
          {label}
        </label>
      )}

      {children}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="font-mono text-xs text-alert flex items-center gap-1"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 4.5v4M8 10.5v1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={helperId}
          className="font-mono text-xs text-ink-mute"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Input                                                              */
/* ------------------------------------------------------------------ */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Visible label rendered above the input. */
  label?: string;
  /** Optional helper text below the input. */
  helperText?: string;
  /** Error message – triggers error styling when truthy. */
  error?: string;
  /** HTML id – auto-generated if omitted. */
  id?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, helperText, error, id: idProp, className = '', ...rest },
    ref,
  ) {
    const autoId = React.useId();
    const id = idProp ?? autoId;

    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const describedBy = [
      error ? errorId : undefined,
      !error && helperText ? helperId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <FieldWrapper
        label={label}
        helperText={helperText}
        error={error}
        htmlFor={id}
      >
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            // layout
            'h-10 w-full px-3',
            // typography
            'font-body text-sm text-ink placeholder:text-ink-mute',
            // surface
            'bg-paper rounded-[2px]',
            // border – default / error
            'border',
            error ? 'border-alert' : 'border-rule',
            // focus
            'outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
            // transition
            'transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]',
            // disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...rest}
        />
      </FieldWrapper>
    );
  },
);

Input.displayName = 'Input';

/* ------------------------------------------------------------------ */
/*  Textarea                                                           */
/* ------------------------------------------------------------------ */

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  /** Visible label rendered above the textarea. */
  label?: string;
  /** Optional helper text below the textarea. */
  helperText?: string;
  /** Error message – triggers error styling when truthy. */
  error?: string;
  /** HTML id – auto-generated if omitted. */
  id?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, helperText, error, id: idProp, className = '', ...rest },
    ref,
  ) {
    const autoId = React.useId();
    const id = idProp ?? autoId;

    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const describedBy = [
      error ? errorId : undefined,
      !error && helperText ? helperId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <FieldWrapper
        label={label}
        helperText={helperText}
        error={error}
        htmlFor={id}
      >
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            // layout
            'min-h-[80px] w-full px-3 py-2',
            // typography
            'font-body text-sm text-ink placeholder:text-ink-mute',
            // surface
            'bg-paper rounded-[2px]',
            // border – default / error
            'border',
            error ? 'border-alert' : 'border-rule',
            // focus
            'outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
            // transition
            'transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]',
            // resize
            'resize-y',
            // disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...rest}
        />
      </FieldWrapper>
    );
  },
);

Textarea.displayName = 'Textarea';

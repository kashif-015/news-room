'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
  confirmLoading?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  onConfirm,
  isDestructive = false,
  confirmLoading = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-paper border border-rule rounded-[4px] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      >
        <h2 id="modal-title" className="font-fraunces text-xl font-semibold text-ink">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-ink-soft leading-relaxed font-sans">{description}</p>
        )}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-rule">
          <Button variant="secondary" size="small" onClick={onClose} disabled={confirmLoading}>
            Cancel
          </Button>
          {onConfirm && (
            <Button
              variant="primary"
              size="small"
              onClick={onConfirm}
              loading={confirmLoading}
              className={isDestructive ? 'bg-alert hover:bg-alert/90 text-white' : ''}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


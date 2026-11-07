'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  forwardRef,
  type ReactNode,
  type KeyboardEvent,
  type CSSProperties,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
  registerTrigger: (value: string, el: HTMLButtonElement | null) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
}

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  /** Simple array API */
  tabs?: TabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;

  /** Compound API */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  forceMount?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used within <Tabs>.`);
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Tabs (Root)                                                        */
/* ------------------------------------------------------------------ */

const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    tabs,
    activeTab: simpleActiveTab,
    onChange,
    value,
    defaultValue,
    onValueChange,
    children,
    className = '',
  },
  ref,
) {
  // If simple tabs array is provided:
  if (tabs && tabs.length > 0) {
    const current = simpleActiveTab || tabs[0].id;
    return (
      <div ref={ref} className={`flex border-b border-rule font-mono text-xs ${className}`}>
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`px-3 py-2 uppercase tracking-wider relative transition-colors ${
                isActive ? 'text-orange font-semibold' : 'text-ink-mute hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Compound API
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const active = isControlled ? value : internalValue;

  const baseId = useId();
  const triggersRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);

  const setActiveTab = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const registerTrigger = useCallback(
    (val: string, el: HTMLButtonElement | null) => {
      if (el) {
        triggersRef.current.set(val, el);
      } else {
        triggersRef.current.delete(val);
      }
    },
    [],
  );

  return (
    <TabsContext.Provider
      value={{ activeTab: active, setActiveTab, baseId, registerTrigger, listRef }}
    >
      <div ref={ref} className={className} data-tabs-root="">
        {children}
      </div>
    </TabsContext.Provider>
  );
});

/* ------------------------------------------------------------------ */
/*  TabsList                                                           */
/* ------------------------------------------------------------------ */

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { children, className = '', 'aria-label': ariaLabel },
  forwardedRef,
) {
  const { listRef } = useTabsContext('TabsList');
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const internalRef = useRef<HTMLDivElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef, listRef],
  );

  useEffect(() => {
    const list = internalRef.current;
    if (!list) return;

    const update = () => {
      const activeButton = list.querySelector<HTMLButtonElement>(
        '[role="tab"][aria-selected="true"]',
      );
      if (activeButton) {
        const listRect = list.getBoundingClientRect();
        const btnRect = activeButton.getBoundingClientRect();
        setIndicator({
          left: btnRect.left - listRect.left + list.scrollLeft,
          width: btnRect.width,
        });
      } else {
        setIndicator(null);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(list);

    return () => ro.disconnect();
  });

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const list = internalRef.current;
    if (!list) return;

    const tabElements = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    const current = document.activeElement as HTMLButtonElement;
    const idx = tabElements.indexOf(current);
    if (idx === -1) return;

    let next: HTMLButtonElement | undefined;
    if (e.key === 'ArrowRight') next = tabElements[(idx + 1) % tabElements.length];
    else if (e.key === 'ArrowLeft') next = tabElements[(idx - 1 + tabElements.length) % tabElements.length];
    else if (e.key === 'Home') next = tabElements[0];
    else if (e.key === 'End') next = tabElements[tabElements.length - 1];

    if (next) {
      e.preventDefault();
      next.focus();
      next.click();
    }
  }, []);

  const indicatorStyle: CSSProperties | undefined = indicator
    ? {
        position: 'absolute',
        bottom: 0,
        left: indicator.left,
        width: indicator.width,
        height: 2,
        transition: 'left 280ms cubic-bezier(0.2, 0.7, 0.2, 1), width 280ms cubic-bezier(0.2, 0.7, 0.2, 1)',
      }
    : undefined;

  return (
    <div
      ref={setRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`relative flex border-b border-rule ${className}`}
    >
      {children}
      {indicator && (
        <span aria-hidden="true" className="pointer-events-none bg-orange" style={indicatorStyle} />
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  TabsTrigger                                                        */
/* ------------------------------------------------------------------ */

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ value, children, className = '', disabled = false }, forwardedRef) {
    const { activeTab, setActiveTab, baseId, registerTrigger } = useTabsContext('TabsTrigger');

    const isActive = activeTab === value;
    const triggerId = `${baseId}-tab-${value}`;
    const panelId = `${baseId}-panel-${value}`;
    const internalRef = useRef<HTMLButtonElement | null>(null);

    const setRef = useCallback(
      (node: HTMLButtonElement | null) => {
        internalRef.current = node;
        registerTrigger(value, node);
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef, registerTrigger, value],
    );

    return (
      <button
        ref={setRef}
        role="tab"
        type="button"
        id={triggerId}
        aria-selected={isActive}
        aria-controls={panelId}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setActiveTab(value);
        }}
        className={[
          'font-mono text-xs uppercase tracking-wider',
          'px-4 py-2.5 cursor-pointer select-none transition-colors duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
          'rounded-[2px]',
          isActive ? 'text-ink font-semibold' : 'text-ink-mute hover:text-ink-soft',
          disabled ? 'opacity-40 cursor-not-allowed' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </button>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  TabsContent                                                        */
/* ------------------------------------------------------------------ */

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ value, children, className = '', forceMount = false }, ref) {
    const { activeTab, baseId } = useTabsContext('TabsContent');
    const isActive = activeTab === value;
    const triggerId = `${baseId}-tab-${value}`;
    const panelId = `${baseId}-panel-${value}`;

    if (!isActive && !forceMount) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId}
        aria-labelledby={triggerId}
        tabIndex={0}
        hidden={!isActive}
        className={[
          'outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
          'rounded-[4px]',
          isActive ? '' : 'hidden',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    );
  },
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;

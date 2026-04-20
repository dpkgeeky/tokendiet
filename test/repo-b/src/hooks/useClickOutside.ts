import { useEffect, useRef, useCallback, type RefObject } from 'react';

type EventType = MouseEvent | TouchEvent;

interface UseClickOutsideOptions {
  enabled?: boolean;
  events?: ('mousedown' | 'touchstart')[];
  ignoreClassNames?: string[];
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: EventType) => void,
  options: UseClickOutsideOptions = {},
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  const {
    enabled = true,
    events = ['mousedown', 'touchstart'],
    ignoreClassNames = [],
  } = options;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const shouldIgnore = useCallback(
    (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof Element)) return false;
      return ignoreClassNames.some(
        (cn) => target.classList.contains(cn) || target.closest(`.${cn}`) !== null,
      );
    },
    [ignoreClassNames],
  );

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: Event) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      if (shouldIgnore(event.target as EventTarget)) return;
      handlerRef.current(event as EventType);
    };

    events.forEach((eventName) => {
      document.addEventListener(eventName, listener, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, listener);
      });
    };
  }, [enabled, events, shouldIgnore]);

  return ref;
}

export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement | null>[],
  handler: (event: EventType) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: Event) => {
      const isInside = refs.some(
        (ref) => ref.current && ref.current.contains(event.target as Node),
      );
      if (!isInside) handler(event as EventType);
    };

    document.addEventListener('mousedown', listener, { passive: true });
    return () => document.removeEventListener('mousedown', listener);
  }, [refs, handler, enabled]);
}

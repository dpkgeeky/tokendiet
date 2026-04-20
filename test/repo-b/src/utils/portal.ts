import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

const PORTAL_ROOT_ID = 'ui-portal-root';

function getPortalRoot(): HTMLElement {
  let root = document.getElementById(PORTAL_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PORTAL_ROOT_ID;
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);
  }
  return root;
}

export function createPortalContainer(id: string): HTMLElement {
  const root = getPortalRoot();
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.setAttribute('data-portal', 'true');
    root.appendChild(container);
  }
  return container;
}

export function removePortalContainer(id: string): void {
  const container = document.getElementById(id);
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

export function usePortal(portalId?: string): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const id = portalId ?? `portal-${Math.random().toString(36).slice(2, 9)}`;

  useEffect(() => {
    const el = createPortalContainer(id);
    setContainer(el);
    return () => removePortalContainer(id);
  }, [id]);

  return container;
}

export function renderPortal(children: ReactNode, container: HTMLElement | null): ReactNode {
  if (!container) return null;
  return createPortal(children, container);
}

export function usePortalRenderer(portalId?: string) {
  const container = usePortal(portalId);

  const render = useCallback(
    (children: ReactNode): ReactNode => {
      return renderPortal(children, container);
    },
    [container],
  );

  return { container, render };
}

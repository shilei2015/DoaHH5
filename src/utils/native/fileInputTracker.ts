const messageName = 'DOAFileInputTracker';
const limitAttributes = [
  'data-max-count',
  'data-maxcount',
  'data-selection-limit',
  'data-limit',
  'max-count',
  'maxcount',
  'selection-limit',
  'limit',
  'maxlength',
  'max'
];

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<string, { postMessage: (message: unknown) => void }>;
    };
    __doaFileInputTrackerInstalled?: boolean;
    __doaLastFileInputCapture?: boolean;
    __doaLastFileInputSelectionLimit?: number | null;
  }
}

const parseSelectionLimit = (value: string | null) => {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const limit = Number.parseInt(match[0], 10);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
};

const selectionLimitFromElement = (element: Element) => {
  let current: Element | null = element;
  while (current) {
    for (const attribute of limitAttributes) {
      const limit = parseSelectionLimit(current.getAttribute(attribute));
      if (limit) return limit;
    }
    current = current.parentElement;
  }
  return null;
};

const fileInputFromEvent = (event: Event) => {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  for (const node of path) {
    if (!(node instanceof Element)) continue;
    if (node instanceof HTMLInputElement && node.type === 'file') {
      return node;
    }
    const nested = node.querySelector<HTMLInputElement>('input[type="file"]');
    if (nested) return nested;
  }

  if (!(event.target instanceof Element)) return null;
  const closest = event.target.closest('input[type="file"], label');
  if (closest instanceof HTMLInputElement && closest.type === 'file') {
    return closest;
  }
  if (closest instanceof HTMLLabelElement) {
    if (closest.control instanceof HTMLInputElement && closest.control.type === 'file') {
      return closest.control;
    }
    return closest.querySelector<HTMLInputElement>('input[type="file"]');
  }
  return null;
};

const postFileInputState = (capture: boolean, selectionLimit: number | null) => {
  window.__doaLastFileInputCapture = capture;
  window.__doaLastFileInputSelectionLimit = selectionLimit;
  try {
    window.webkit?.messageHandlers?.[messageName]?.postMessage({ capture, selectionLimit });
  } catch {}
};

const updateFileInputState = (event: Event) => {
  const input = fileInputFromEvent(event);
  if (!input) return;

  const capture = input.hasAttribute('capture');
  const selectionLimit = selectionLimitFromElement(input);
  postFileInputState(capture, selectionLimit);
};

export const installFileInputTracker = () => {
  if (window.__doaFileInputTrackerInstalled) return;
  window.__doaFileInputTrackerInstalled = true;
  window.__doaLastFileInputCapture = false;
  window.__doaLastFileInputSelectionLimit = null;

  ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown', 'focusin'].forEach((name) => {
    document.addEventListener(name, updateFileInputState, true);
  });
};

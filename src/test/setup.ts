import { vi, beforeEach } from 'vitest';

// lucide global — renderer code calls lucide.createIcons() before commit 4 migration
Object.defineProperty(globalThis, 'lucide', {
  value: { createIcons: vi.fn() },
  writable: true,
  configurable: true,
});

// jsdom does not implement SVGElement.getComputedTextLength
if (typeof SVGElement !== 'undefined') {
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    value: vi.fn(() => 5.5),
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

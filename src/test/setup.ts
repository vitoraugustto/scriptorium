import { vi } from "vitest";

// jsdom does not implement SVGElement.getComputedTextLength
if (typeof SVGElement !== "undefined") {
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    value: vi.fn(() => 5.5),
    writable: true,
    configurable: true,
  });
}

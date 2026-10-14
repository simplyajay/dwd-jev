import "@testing-library/jest-dom/vitest";

// jsdom has no layout engine, so it ships no ResizeObserver. Radix components
// (e.g. Checkbox) construct one on mount; an inert stand-in is enough for tests.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

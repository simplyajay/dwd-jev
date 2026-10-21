import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver, which Radix components construct on mount.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

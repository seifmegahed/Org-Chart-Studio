import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

if (typeof window !== "undefined") {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    Object.defineProperty(window.HTMLElement.prototype, "hasPointerCapture", {
      value: () => false,
      configurable: true,
    });
  }

  if (!window.HTMLElement.prototype.setPointerCapture) {
    Object.defineProperty(window.HTMLElement.prototype, "setPointerCapture", {
      value: () => undefined,
      configurable: true,
    });
  }

  if (!window.HTMLElement.prototype.releasePointerCapture) {
    Object.defineProperty(window.HTMLElement.prototype, "releasePointerCapture", {
      value: () => undefined,
      configurable: true,
    });
  }

  if (!window.HTMLElement.prototype.scrollIntoView) {
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      value: () => undefined,
      configurable: true,
    });
  }

  const mockedStorage = createStorageMock();

  Object.defineProperty(window, "localStorage", {
    value: mockedStorage,
    configurable: true,
  });

  Object.defineProperty(globalThis, "localStorage", {
    value: mockedStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});

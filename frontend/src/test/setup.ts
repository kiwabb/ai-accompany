import '@testing-library/jest-dom';

class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] ?? null;
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new LocalStorageMock(),
  });
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

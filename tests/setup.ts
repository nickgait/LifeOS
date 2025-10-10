/**
 * Vitest Setup File
 * Global test setup and utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  registerables: [],
}));

// Mock service worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({ scope: '/' }),
    ready: Promise.resolve({
      active: { postMessage: vi.fn() },
    }),
  },
  writable: true,
});

// Mock notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  writable: true,
});

// Global test utilities
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockDate = (date: string) => {
  vi.setSystemTime(new Date(date));
};

export const resetDate = () => {
  vi.useRealTimers();
};

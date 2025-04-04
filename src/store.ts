export interface Store {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

let store: Store;

// Memory store for server-side rendering
const createMemoryStore = (): Store => {
  const storage: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => {
      return key in storage ? storage[key] : null;
    },
    setItem: (key: string, value: string): void => {
      storage[key] = value;
    },
  };
};

// Cookie-based store for both client and server
const createCookieStore = (): Store => {
  return {
    getItem: (key: string): string | null => {
      if (typeof document === 'undefined') return null;

      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(key + '=')) {
          return decodeURIComponent(cookie.substring(key.length + 1));
        }
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      if (typeof document === 'undefined') return;

      // Set cookie with a long expiration (1 year)
      const date = new Date();
      date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
      document.cookie = `${key}=${encodeURIComponent(
        value
      )}; expires=${date.toUTCString()}; path=/`;
    },
  };
};

// No-op store as fallback
const noopStore: Store = {
  getItem: function (): null {
    return null;
  },
  setItem: function (): void {},
};

// Determine which store to use
if (typeof document !== 'undefined' && 'cookie' in document) {
  // Use cookies if available (works for both client and server with cookies)
  store = createCookieStore();
} else if (typeof window !== 'undefined' && 'localStorage' in window) {
  try {
    const key = '__pushtell_react__';
    window.localStorage.setItem(key, key);
    if (window.localStorage.getItem(key) !== key) {
      store = noopStore;
    } else {
      window.localStorage.removeItem(key);
      store = window.localStorage;
    }
  } catch (e) {
    store = noopStore;
  }
} else {
  // Use memory store for server-side rendering
  store = createMemoryStore();
}

export default store;

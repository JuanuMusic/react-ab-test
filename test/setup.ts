import { LocalStorage } from 'node-localstorage';
import { v4 as UUID } from 'uuid';

// Declare global types
declare global {
  interface Window {
    localStorage: typeof LocalStorage;
  }
}

// Use type assertions with eslint-disable comments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).localStorage = (window as any).localStorage = new LocalStorage(
  `/tmp/${UUID()}`
);

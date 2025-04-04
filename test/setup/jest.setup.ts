// Add type declarations for global objects
interface CustomMessagePort {
  onmessage: ((this: MessagePort, ev: MessageEvent) => unknown) | null;
  postMessage: jest.Mock;
}

interface CustomMessageChannel {
  port1: CustomMessagePort;
  port2: CustomMessagePort;
}

// Extend Window interface
declare global {
  interface Window {
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
  }
}

// Mock MessageChannel which is not available in Node environment
global.MessageChannel = class implements CustomMessageChannel {
  port1: CustomMessagePort;
  port2: CustomMessagePort;

  constructor() {
    this.port1 = {
      onmessage: null,
      postMessage: jest.fn(),
    };
    this.port2 = {
      onmessage: null,
      postMessage: jest.fn(),
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any; // Cast to any to bypass type checking for the mock

// Add TextEncoder and TextDecoder polyfills
import { TextEncoder, TextDecoder } from 'util';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).TextDecoder = TextDecoder;

// Mock requestAnimationFrame if needed
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

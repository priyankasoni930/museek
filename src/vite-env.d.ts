
/// <reference types="vite/client" />

declare global {
  interface Window {
    installPWA?: () => void;
    deferredPrompt?: any;
  }
}

export {};

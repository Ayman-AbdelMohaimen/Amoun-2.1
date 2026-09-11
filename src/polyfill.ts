declare global {
  interface Window {
    process: any;
    global: any;
  }
}

if (typeof window !== 'undefined') {
  if (typeof window.process === 'undefined') {
    window.process = {
      env: { NODE_ENV: import.meta.env.MODE || 'production' },
      argv: [],
      cwd: () => '/',
      platform: 'browser',
      version: '',
      versions: {},
      nextTick: (fn: () => void) => setTimeout(fn, 0),
    };
  }
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
}

export {};

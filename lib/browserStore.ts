import { useSyncExternalStore } from "react";

// Minimal store for values that live in browser storage. The server render (static export)
// sees `serverValue`; the client reads the real value after hydration without a mismatch.
export function createBrowserStore<T>(load: () => T, serverValue: T) {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();

  const getSnapshot = () => (cache ??= { value: load() }).value;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    use: () => useSyncExternalStore(subscribe, getSnapshot, () => serverValue),
    set: (value: T) => {
      cache = { value };
      listeners.forEach((l) => l());
    },
  };
}

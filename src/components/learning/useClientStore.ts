import { useRef, useCallback, useSyncExternalStore } from "react";
import type { ReadableAtom } from "nanostores";

/**
 * SSR-safe drop-in replacement for @nanostores/react's useStore.
 * Aliased as '@nanostores/react' in astro.config.mjs.
 *
 * The server-side "Invalid hook call" errors in dev mode are harmless —
 * they come from Vite's SSR dep optimizer creating a duplicate React copy.
 * Pages still render correctly (200 status) because Astro falls back to
 * client-side hydration. This does NOT affect production builds.
 */
export function useStore<T>(store: ReadableAtom<T>): T {
  if (typeof window === "undefined") {
    // Server: return current value, no subscription
    return store.get();
  }

  // Client: full reactive subscription via useSyncExternalStore
  const snapshotRef = useRef(store.get());
  snapshotRef.current = store.get();

  const subscribe = useCallback(
    (onChange: () => void) => {
      return store.listen((value: T) => {
        if (snapshotRef.current !== value) {
          snapshotRef.current = value;
          onChange();
        }
      });
    },
    [store]
  );

  const getSnapshot = () => snapshotRef.current;

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

import { useMemo, useSyncExternalStore } from "react";

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
  };
}

/** The last size read, so the snapshot keeps its identity until the size changes. */
let last: WindowSize = { width: 0, height: 0 };

function getSnapshot(): WindowSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (last.width !== width || last.height !== height) last = { width, height };
  return last;
}

/**
 * Returns the window's inner `{ width, height }` in CSS pixels (including any scrollbar), and
 * re-renders when the window is resized. During server rendering and on the first render while
 * hydrating it returns `serverSize` (`0 × 0` by default), so the client's first render matches
 * the server's HTML. It returns the same object while the size is unchanged.
 */
export function useWindowSize(serverSize: WindowSize = { width: 0, height: 0 }): WindowSize {
  const { width, height } = serverSize;
  // Keyed on the numbers, so passing a new object with the same size each render is fine.
  const server = useMemo(() => ({ width, height }), [width, height]);
  return useSyncExternalStore(subscribe, getSnapshot, () => server);
}

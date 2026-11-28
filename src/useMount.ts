import { useEffect } from "react";

/**
 * Calls `fn` once, after the component first mounts. Later renders don't call it again, even
 * with a different `fn`. `fn` can be async, and what it returns is ignored rather than treated
 * as a cleanup (use `useUnmount` for that). Like any effect, it doesn't run on the server, and
 * React's development Strict Mode runs it twice.
 */
export function useMount(fn: () => unknown): void {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on mount only, by design.
  }, []);
}

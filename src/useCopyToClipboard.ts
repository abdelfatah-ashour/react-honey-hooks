import { useCallback, useEffect, useState } from "react";

export interface CopyToClipboard {
  /** Copies `text`; resolves `true` on success and `false` (setting `error`) on failure. */
  readonly copy: (text: string) => Promise<boolean>;
  /** `true` after a successful copy, until `resetMs` has passed. */
  readonly copied: boolean;
  /** Why the last copy failed, or `null` if it succeeded or nothing was copied yet. */
  readonly error: Error | null;
}

interface State {
  copied: boolean;
  /** Counts successful copies, so each one restarts the reset timer. */
  copies: number;
  error: Error | null;
}

/** Browsers reject with a `DOMException` such as `NotAllowedError`; keep it as it is. */
function toError(reason: unknown): Error {
  if (reason instanceof Error || reason instanceof DOMException) return reason;
  return new Error(String(reason));
}

/**
 * Copies text with the Clipboard API. `copy(text)` resolves `true` and sets `copied`, which
 * turns back to `false` after `resetMs` (2 seconds by default; each copy restarts the wait;
 * `Infinity` keeps it `true` until the next copy).
 * If the API is missing (an insecure `http:` page or an old browser) or the browser refuses the
 * write, it resolves `false` and sets `error` instead of throwing. `copy` keeps its identity.
 */
export function useCopyToClipboard(resetMs = 2000): CopyToClipboard {
  const [state, setState] = useState<State>({ copied: false, copies: 0, error: null });

  useEffect(() => {
    // A non-finite delay means "never reset"; setTimeout would treat Infinity as 0.
    if (!state.copied || !Number.isFinite(resetMs)) return;
    const id = setTimeout(() => {
      setState((s) => ({ ...s, copied: false }));
    }, resetMs);
    return () => {
      clearTimeout(id);
    };
  }, [state.copied, state.copies, resetMs]);

  const copy = useCallback(async (text: string) => {
    try {
      // Optional chaining: the API is missing on insecure pages and in old browsers.
      const clipboard = (navigator as Partial<Navigator>).clipboard;
      if (!clipboard) throw new Error("The Clipboard API is not available on this page.");
      await clipboard.writeText(text);
      setState((s) => ({ copied: true, copies: s.copies + 1, error: null }));
      return true;
    } catch (reason) {
      setState((s) => ({ ...s, copied: false, error: toError(reason) }));
      return false;
    }
  }, []);

  return { copy, copied: state.copied, error: state.error };
}

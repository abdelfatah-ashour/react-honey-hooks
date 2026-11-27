import { useCallback, useSyncExternalStore } from "react";

export type ScriptStatus = "idle" | "loading" | "ready" | "error";

interface Entry {
  status: ScriptStatus;
  listeners: Set<() => void>;
}

/** One entry per `src` for the page's lifetime, shared by every component using it. */
const scripts = new Map<string, Entry>();

/** Adds the script tag for `src` the first time anything subscribes to it. */
function load(src: string): Entry {
  const existing = scripts.get(src);
  if (existing) return existing;
  // A tag the page added itself, usually in its HTML. There's no way to tell whether it has
  // loaded, so it is assumed to be ready.
  const url = new URL(src, document.baseURI).href;
  const inPage = [...document.scripts].some((script) => script.src === url);
  const entry: Entry = { status: inPage ? "ready" : "loading", listeners: new Set() };
  scripts.set(src, entry);
  if (inPage) return entry;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  const settle = (status: ScriptStatus) => () => {
    entry.status = status;
    for (const listener of entry.listeners) listener();
  };
  script.addEventListener("load", settle("ready"));
  script.addEventListener("error", settle("error"));
  document.head.append(script);
  return entry;
}

/**
 * Loads the external script `src` and returns its status: `"loading"` until it loads, then
 * `"ready"`, or `"error"` if it fails. A `null` src is `"idle"` and loads nothing, for loading on
 * demand. Each src gets one async `<script>` tag for the page's lifetime, shared by every
 * component asking for it; a tag the page already has for src is treated as ready. The tag stays
 * when components unmount, and a failed src stays failed until the page reloads. During server
 * rendering it is `"loading"`, or `"idle"` for `null`.
 */
export function useScript(src: string | null): ScriptStatus {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (src === null) return () => undefined;
      const entry = load(src);
      entry.listeners.add(onChange);
      return () => {
        entry.listeners.delete(onChange);
      };
    },
    [src],
  );
  const getSnapshot = (): ScriptStatus =>
    src === null ? "idle" : (scripts.get(src)?.status ?? "loading");
  return useSyncExternalStore(subscribe, getSnapshot, () => (src === null ? "idle" : "loading"));
}

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

/** What `navigator.connection` reports, in the browsers that have it (Chromium-based ones). */
interface NetworkInformation extends EventTarget {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: string;
}

/** The browser's connection; the details are `undefined` where the browser doesn't report them. */
export interface NetworkState {
  /** Whether the browser has a network connection (`navigator.onLine`). */
  readonly online: boolean;
  /** When `online` last changed while the component was mounted, or `null` if it hasn't. */
  readonly since: Date | null;
  /** How fast the connection behaves: `"slow-2g"`, `"2g"`, `"3g"` or `"4g"`. */
  readonly effectiveType: string | undefined;
  /** Estimated bandwidth, in megabits per second. */
  readonly downlink: number | undefined;
  /** Estimated round-trip time, in milliseconds. */
  readonly rtt: number | undefined;
  /** Whether the user asked for reduced data use. */
  readonly saveData: boolean | undefined;
  /** The kind of connection, such as `"wifi"` or `"cellular"`. */
  readonly type: string | undefined;
}

type Status = Omit<NetworkState, "since">;

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribe(onChange: () => void): () => void {
  const details = connection();
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  details?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
    details?.removeEventListener("change", onChange);
  };
}

let last: Status | undefined;

/** The current status, as the same object while nothing in it has changed. */
function getSnapshot(): Status {
  const details = connection();
  const next: Status = {
    online: navigator.onLine,
    effectiveType: details?.effectiveType,
    downlink: details?.downlink,
    rtt: details?.rtt,
    saveData: details?.saveData,
    type: details?.type,
  };
  const keys = Object.keys(next) as (keyof Status)[];
  if (!last || keys.some((key) => last?.[key] !== next[key])) last = next;
  return last;
}

/** The server can't see the user's connection, so it assumes the common case. */
const SERVER_STATUS: Status = {
  online: true,
  effectiveType: undefined,
  downlink: undefined,
  rtt: undefined,
  saveData: undefined,
  type: undefined,
};

/**
 * Describes the browser's network connection: whether it is online, when that last changed,
 * and, in browsers that report them (Chromium-based ones), how fast it is and whether the user
 * asked to save data. It re-renders on the `online` and `offline` events and when the connection
 * changes, and returns the same object while nothing has. The details are `undefined` where the
 * browser doesn't report them. On the server and while hydrating it reports online, with no
 * details.
 */
export function useNetwork(): NetworkState {
  const status = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATUS);
  const [since, setSince] = useState<Date | null>(null);
  useEffect(() => {
    const onChange = () => {
      setSince(new Date());
    };
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);
  return useMemo(() => ({ ...status, since }), [status, since]);
}

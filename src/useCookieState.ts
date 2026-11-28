import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The attributes a cookie is written with. */
export interface CookieOptions {
  /** The path the cookie is sent for. Defaults to `"/"`, the whole site. */
  path?: string;
  /** The domain the cookie is sent to. Defaults to the page's own host. */
  domain?: string;
  /** Seconds until the cookie expires. Without it or `expires`, it lasts for the session. */
  maxAge?: number;
  /** When the cookie expires. */
  expires?: Date;
  /** Whether the cookie is sent with requests from other sites. */
  sameSite?: "strict" | "lax" | "none";
  /** Whether the cookie is sent over HTTPS only. */
  secure?: boolean;
}

export interface CookieStateOptions extends CookieOptions {
  /** The value while the cookie is missing, and on the server. */
  defaultValue?: string;
}

/**
 * Writes the cookie, or deletes it when given `undefined`. Takes a value or a function of the
 * current value, and optional attributes that override the hook's for this write.
 */
export type SetCookieState = (
  value: string | undefined | ((current: string | undefined) => string | undefined),
  options?: CookieOptions,
) => void;

/** Called after this page writes a cookie, so every hook re-reads its cookie. */
const listeners = /* @__PURE__ */ new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** There are no cookies on the server (or while hydrating), so it renders `defaultValue`. */
function getServerCookie(): undefined {
  return undefined;
}

/** Decodes `text`, or returns it as it is when it isn't valid percent-encoding. */
function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** The page's cookies, or none where it may not use them (such as a sandboxed iframe). */
function allCookies(): string {
  try {
    return document.cookie;
  } catch {
    return "";
  }
}

function readCookie(name: string): string | undefined {
  for (const pair of allCookies().split("; ")) {
    const at = pair.indexOf("=");
    if (decode(pair.slice(0, at)) === name) {
      return decode(pair.slice(at + 1));
    }
  }
  return undefined;
}

/** Writes the cookie, or deletes it when `value` is `undefined`. */
function writeCookie(name: string, value: string | undefined, options: CookieOptions): void {
  const { path = "/", domain, maxAge, expires, sameSite, secure } = options;
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}`, `path=${path}`];
  if (domain !== undefined) parts.push(`domain=${domain}`);
  if (value === undefined) parts.push("max-age=0");
  else {
    if (maxAge !== undefined) parts.push(`max-age=${String(maxAge)}`);
    if (expires !== undefined) parts.push(`expires=${expires.toUTCString()}`);
  }
  if (sameSite !== undefined) parts.push(`samesite=${sameSite}`);
  if (secure) parts.push("secure");
  try {
    document.cookie = parts.join("; ");
  } catch {
    // The page may not use cookies (such as a sandboxed iframe), so there is nothing to write.
    return;
  }
  for (const listener of listeners) listener();
}

/**
 * A cookie's value as state. Returns `[value, setValue]`. `value` is the cookie named `name`,
 * or `defaultValue` while it is missing. `setValue` writes the cookie with the hook's cookie
 * options (or the ones given to that call), and `setValue(undefined)` deletes it. Names and
 * values are percent-encoded, so any text round-trips; cookies written unencoded by other code
 * are still read. Every hook reading the same cookie updates when one of them writes it, but
 * cookies changed by other code (or by the server) are only seen on the next render. On the
 * server, and while hydrating, `value` is `defaultValue`, so there is no hydration mismatch.
 * Where the page may not use cookies (a sandboxed iframe), `value` stays `defaultValue` and
 * writes do nothing. `setValue` never changes and always uses the latest name and options.
 */
export function useCookieState(
  name: string,
  options: CookieStateOptions & { defaultValue: string },
): readonly [string, SetCookieState];
export function useCookieState(
  name: string,
  options?: CookieStateOptions,
): readonly [string | undefined, SetCookieState];
export function useCookieState(
  name: string,
  { defaultValue, ...cookieOptions }: CookieStateOptions = {},
): readonly [string | undefined, SetCookieState] {
  const cookie = useSyncExternalStore(subscribe, () => readCookie(name), getServerCookie);

  const latest = useRef({ name, defaultValue, cookieOptions });
  useEffect(() => {
    latest.current = { name, defaultValue, cookieOptions };
  });
  const [set] = useState(() => {
    const setCookie: SetCookieState = (next, options) => {
      const { name, defaultValue, cookieOptions } = latest.current;
      const resolved = typeof next === "function" ? next(readCookie(name) ?? defaultValue) : next;
      writeCookie(name, resolved, { ...cookieOptions, ...options });
    };
    return setCookie;
  });

  return [cookie ?? defaultValue, set] as const;
}

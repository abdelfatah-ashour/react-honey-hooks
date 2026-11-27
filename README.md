# 🍯 React Honey Hooks

Small, typed React hooks. Zero dependencies, ESM + CJS, SSR-safe, and tested in real
Chromium, Firefox and WebKit. Tree-shakeable: all 16 hooks are about 3 kB minified and
gzipped, and your bundle only includes the ones you import.

```bash
npm install react-honey-hooks
```

Requires React 18 or newer.

## Hooks

- [`useQuery`](#usequery): read the URL's query params
- [`useQueryState`](#usequerystate): read and update the URL's query params
- [`useCountdown`](#usecountdown): count down to a date
- [`useClickOutside`](#useclickoutside): detect presses outside an element
- [`useCopyToClipboard`](#usecopytoclipboard): copy text and show that it worked
- [`useDebouncedValue`](#usedebouncedvalue): a value that waits for changes to settle
- [`useDebouncedCallback`](#usedebouncedcallback): a function that waits for calls to stop
- [`useEventListener`](#useeventlistener): listen to any DOM event, typed
- [`useHotkey`](#usehotkey): keyboard shortcuts such as `mod+k`
- [`useElementSize`](#useelementsize): measure an element as it resizes
- [`useInView`](#useinview): know when an element scrolls into view
- [`useInterval`](#useinterval): run something every few milliseconds
- [`useTimeout`](#usetimeout): run something once after a delay
- [`useLocalStorage`](#uselocalstorage): state that survives reloads and syncs across tabs
- [`useSessionStorage`](#usesessionstorage): state that survives reloads in this tab only
- [`useMediaQuery`](#usemediaquery): match a CSS media query
- [`useOnlineStatus`](#useonlinestatus): know when the network drops
- [`usePageVisibility`](#usepagevisibility): know when the tab is hidden

---

### `useQuery`

```ts
function useQuery<K extends string = string>(): Query<K>;

interface Query<K extends string = string> {
  readonly params: Readonly<Partial<Record<K, string>>>;
  readonly getAll: (key: K) => readonly string[];
}
```

Reads the current URL's query string. It re-reads on browser back/forward navigation
(`popstate`) and keeps the same object identity while the URL is unchanged, so it is safe to
use in effect dependencies. During server rendering `params` is `{}`.

Pass the keys you expect to get them type-checked: reading an undeclared key is a compile
error, and every value is `string | undefined` because any key can be missing from the URL.
For repeated keys (`?tag=a&tag=b`) `params` holds the last value; `getAll` returns them all.

```tsx
import { useQuery } from "react-honey-hooks";

// https://example.com/products?category=books&tag=new&tag=sale
function Products() {
  const { params, getAll } = useQuery<"category" | "sort" | "tag">();
  const { category = "all", sort = "relevance" } = params;

  return (
    <p>
      Showing {category} ({getAll("tag").join(", ")}), sorted by {sort}
    </p>
  );
}
```

It also re-renders when [`useQueryState`](#usequerystate) changes the URL. It does not observe
`history.pushState` calls made by client-side routers; use your router's own hook there.

---

### `useQueryState`

```ts
function useQueryState<K extends string = string>(): readonly [Query<K>, SetQuery<K>];

type SetQuery<K extends string = string> = (
  updates: Partial<Record<K, string | readonly string[] | null>>,
  options?: { mode?: "replace" | "push" }, // defaults to "replace"
) => void;
```

Reads the query string exactly like `useQuery`, and adds `setQuery` to change it without a
router:

- A string sets a key, an array sets repeated keys (`?tag=a&tag=b`), and `null` or `[]`
  removes it. Keys you leave out are kept, and updated keys keep their place in the URL.
- By default the current history entry is replaced. Pass `{ mode: "push" }` to add an entry,
  so the browser's Back button undoes the change.
- Every `useQuery` and `useQueryState` on the page re-renders with the new URL.
- An update that changes nothing writes nothing, and `history.state` is kept, so routers that
  store data there are not disturbed. `setQuery` keeps its identity.

```tsx
import { useQueryState } from "react-honey-hooks";

// https://example.com/products?category=books&page=3
function Pagination() {
  const [{ params }, setQuery] = useQueryState<"page">();
  const page = Number(params.page ?? "1");

  return (
    <button
      onClick={() => {
        setQuery({ page: String(page + 1) }, { mode: "push" });
      }}
    >
      Next page
    </button>
  );
}
```

---

### `useCountdown`

```ts
function useCountdown(target: Date | number | string, options?: CountdownOptions): Countdown;

interface CountdownOptions {
  onExpire?: () => void;
}

interface Countdown {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly totalMilliseconds: number;
  readonly isExpired: boolean;
}
```

Updates once per second until `target` is reached, then stops its timer. Remaining time
never goes negative; a past or invalid date is reported as expired.

`onExpire` is called once each time a running countdown reaches zero, including after you
switch to a new future target. It is not called on mount when the target has already
passed (check `isExpired` for that). The latest `onExpire` is always used, so it need not be
memoised.

```tsx
import { useCountdown } from "react-honey-hooks";

const LAUNCH = new Date("2027-01-01T00:00:00Z");

function Launch() {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(LAUNCH, {
    onExpire: () => {
      console.log("Launched");
    },
  });

  if (isExpired) return <p>We have lift-off 🚀</p>;
  return (
    <p>
      {days}d {hours}h {minutes}m {seconds}s
    </p>
  );
}
```

---

### `useClickOutside`

```ts
function useClickOutside(
  refs: RefObject<Element | null> | readonly RefObject<Element | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: ClickOutsideOptions,
): void;

interface ClickOutsideOptions {
  enabled?: boolean; // defaults to true
}
```

Calls `handler` when a mouse press or touch starts outside the referenced element, or
outside all of them when you pass several refs (handy for a trigger plus a portalled popover).
Presses on those elements or their descendants are ignored, and unattached refs are skipped.
Pass `{ enabled: false }` to stop listening. The latest `refs` and `handler` are always used,
so inline arrays and functions are fine and no `useMemo`/`useCallback` is needed.

```tsx
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "react-honey-hooks";

function Dropdown() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useClickOutside(
    [triggerRef, menuRef],
    () => {
      setOpen(false);
    },
    { enabled: open },
  );

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen((o) => !o)}>
        Menu
      </button>
      {open && createPortal(<ul ref={menuRef}>{/* … */}</ul>, document.body)}
    </>
  );
}
```

---

### `useCopyToClipboard`

```ts
function useCopyToClipboard(resetMs?: number): CopyToClipboard;

interface CopyToClipboard {
  readonly copy: (text: string) => Promise<boolean>;
  readonly copied: boolean;
  readonly error: Error | null;
}
```

Copies text with the Clipboard API. `copy(text)` resolves `true` and sets `copied`, which
turns back to `false` after `resetMs` (2000 by default; each copy restarts the wait, and
`Infinity` keeps it until the next copy). It never throws: if the API is missing (pages served
over plain `http:`, old browsers) or the browser refuses the write, it resolves `false` and
sets `error`. A later successful copy clears `error`. `copy` keeps its identity.

```tsx
import { useCopyToClipboard } from "react-honey-hooks";

function InstallCommand() {
  const { copy, copied, error } = useCopyToClipboard();
  const command = "npm install react-honey-hooks";

  return (
    <p>
      <code>{command}</code>
      <button onClick={() => void copy(command)}>{copied ? "Copied!" : "Copy"}</button>
      {error && <span role="alert">Couldn't copy: {error.message}</span>}
    </p>
  );
}
```

---

### `useDebouncedValue`

```ts
function useDebouncedValue<T>(value: T, delayMs: number): T;
```

Returns `value`, but only updates once `value` has stopped changing for `delayMs`. The first
render returns `value` straight away, and changing `delayMs` restarts the wait. Use it to
derive expensive work (a fetch, a filter over a big list) from fast-changing input.

```tsx
import { useState } from "react";
import { useDebouncedValue } from "react-honey-hooks";

function ProductSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const results = useProducts(debouncedQuery); // only refetches after typing pauses

  return (
    <>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <ProductList products={results} />
    </>
  );
}
```

---

### `useDebouncedCallback`

```ts
function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): DebouncedFunction<A>;

interface DebouncedFunction<A extends unknown[]> {
  (...args: A): void;
  readonly cancel: () => void; // drop the pending call
  readonly flush: () => void; // run the pending call now
}
```

Returns a function that, however often it is called, runs `fn` once with the last arguments
after `delayMs` without further calls. A delay of 0 still collapses calls made in the same
task. The latest `fn` is always used, so inline functions are fine, and the returned function
keeps its identity for the component's lifetime. A pending call keeps the delay it was
scheduled with, and is dropped when the component unmounts.

```tsx
import { useDebouncedCallback } from "react-honey-hooks";

function NoteEditor({ save }: { save: (text: string) => void }) {
  const saveSoon = useDebouncedCallback(save, 1000);

  return (
    <textarea
      onChange={(event) => {
        saveSoon(event.target.value);
      }}
      onBlur={saveSoon.flush}
    />
  );
}
```

---

### `useEventListener`

```ts
// window (the default), document, or an element ref; the event type is checked against it
function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: EventListenerHookOptions & { target?: Window },
): void;
function useEventListener<K extends keyof DocumentEventMap>(
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options: EventListenerHookOptions & { target: Document },
): void;
function useEventListener<K extends keyof HTMLElementEventMap>(
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options: EventListenerHookOptions & { target: RefObject<HTMLElement | null> },
): void;

interface EventListenerHookOptions {
  enabled?: boolean; // defaults to true
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}
```

Adds an event listener for as long as the component is mounted. The handler receives the
right event type (`KeyboardEvent` for `"keydown"`, and so on), and an event name the target
doesn't have is a compile error. The latest `handler` is always called without
re-subscribing, so inline functions are fine. The listener moves when the ref's element,
`type` or options change, and `{ enabled: false }` removes it.

```tsx
import { useRef, useState } from "react";
import { useEventListener } from "react-honey-hooks";

function Gallery({ onClose }: { onClose: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEventListener("keydown", (event) => {
    if (event.key === "Escape") onClose();
  });
  useEventListener(
    "scroll",
    () => {
      setScrolled((listRef.current?.scrollTop ?? 0) > 0);
    },
    { target: listRef, passive: true },
  );

  return (
    <ul ref={listRef} className={scrolled ? "with-shadow" : undefined}>
      {/* … */}
    </ul>
  );
}
```

---

### `useHotkey`

```ts
function useHotkey(
  keys: string,
  handler: (event: KeyboardEvent) => void,
  options?: HotkeyOptions,
): void;

interface HotkeyOptions {
  enabled?: boolean; // defaults to true
  ignoreInputs?: boolean; // defaults to true
}
```

Calls `handler` when a keyboard shortcut is pressed anywhere on the page.

- `keys` is a key name, optionally after modifiers joined with `+`: `"Escape"`, `"/"`,
  `"ctrl+s"`, `"mod+shift+k"`. Key names are `KeyboardEvent.key` values, in any case.
- Modifiers are `ctrl`, `alt`, `shift`, `meta` and `mod`, which means ⌘ on Apple platforms and
  Ctrl elsewhere. They must match exactly: `"ctrl+s"` doesn't fire for Ctrl+Shift+S.
- For symbols such as `"?"`, Shift isn't checked unless you list it, because keyboard layouts
  differ in which symbols need it. Use `space` and `plus` (or `"ctrl++"`) for those keys.
- Presses while typing in an input, textarea, select or editable content are ignored, unless
  `ignoreInputs` is `false`.
- An invalid shortcut such as `"ctrl+"` or `"hyper+k"` never fires.
- The handler can call `event.preventDefault()` to stop the browser's own shortcut.

```tsx
import { useState } from "react";
import { useHotkey } from "react-honey-hooks";

function Editor({ save }: { save: () => void }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useHotkey("mod+s", (event) => {
    event.preventDefault(); // don't open the browser's "Save page" dialog
    save();
  });
  useHotkey("mod+k", () => {
    setPaletteOpen(true);
  });
  useHotkey(
    "Escape",
    () => {
      setPaletteOpen(false);
    },
    { enabled: paletteOpen, ignoreInputs: false },
  );

  return paletteOpen ? <CommandPalette /> : <Document />;
}
```

---

### `useElementSize`

```ts
function useElementSize(ref: RefObject<Element | null>, options?: ElementSizeOptions): ElementSize;

interface ElementSize {
  readonly width: number;
  readonly height: number;
}

interface ElementSizeOptions {
  box?: "content-box" | "border-box"; // default "content-box"
}
```

Measures the element held by `ref` with a `ResizeObserver` and re-renders when its size
changes, whether from the window resizing, its content changing or its styles changing.

- Sizes are in CSS pixels and can be fractional. `"content-box"` excludes padding and border;
  `"border-box"` includes them.
- It is `0 × 0` during server rendering, before the first measurement and in browsers without
  `ResizeObserver`.
- It keeps the last size while the ref holds no element, and returns the same object while the
  size is unchanged, so it is safe in effect dependencies.
- If the ref moves to another element, the next render measures that one instead.

```tsx
import { useRef } from "react";
import { useElementSize } from "react-honey-hooks";

function ResponsiveCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref);

  return <div ref={ref}>{width < 400 ? <CompactLayout /> : <WideLayout />}</div>;
}
```

---

### `useInView`

```ts
function useInView(ref: RefObject<Element | null>, options?: InViewOptions): boolean;

interface InViewOptions {
  once?: boolean; // stay true after the first time in view
  root?: Element | Document | null; // defaults to the viewport
  rootMargin?: string; // e.g. "200px 0px" to trigger early
  threshold?: number | readonly number[]; // 0 (any pixel, the default) to 1 (all of it)
}
```

Returns whether the referenced element is in view, using an `IntersectionObserver`. It is
`false` until the first observation, during server rendering and while the ref holds no
element. With `once` it stays `true` after the element first appears, which suits lazy
loading and entrance animations. The observer follows the ref to a new element and picks up
changed options (an inline `threshold` array is fine), and disconnects on unmount. In the rare
browser without `IntersectionObserver` it returns `true`, so content is never hidden forever.

```tsx
import { useRef } from "react";
import { useInView } from "react-honey-hooks";

function LazyChart({ data }: { data: readonly number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, rootMargin: "200px" });

  return <div ref={ref}>{visible ? <Chart data={data} /> : <ChartSkeleton />}</div>;
}
```

---

### `useInterval`

```ts
function useInterval(callback: () => void, delayMs: number | null): void;
```

Calls `callback` every `delayMs` milliseconds. Pass `null` to pause. Any delay that is not a
positive, finite number also pauses, because a 0 ms interval would run as fast as the browser
allows. Changing `delayMs` restarts the interval. The latest `callback` is always called
without restarting it, so inline functions are fine.

```tsx
import { useState } from "react";
import { useInterval } from "react-honey-hooks";

function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useInterval(
    () => {
      setSeconds((s) => s + 1);
    },
    running ? 1000 : null,
  );

  return (
    <button
      onClick={() => {
        setRunning((r) => !r);
      }}
    >
      {seconds}s, {running ? "pause" : "start"}
    </button>
  );
}
```

---

### `useTimeout`

```ts
function useTimeout(callback: () => void, delayMs: number | null): void;
```

Calls `callback` once, `delayMs` milliseconds after mounting. Changing `delayMs` starts the
wait again from now, and `null` (or a negative or non-finite delay) cancels it until a valid
delay is given. A delay of 0 calls it after the current task. The latest `callback` is always
called, and nothing runs after the component unmounts.

```tsx
import { useTimeout } from "react-honey-hooks";

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useTimeout(onDismiss, 4000);

  return <div role="status">{message}</div>;
}
```

---

### `useLocalStorage`

```ts
function useLocalStorage<T>(
  key: string,
  initialValue: T,
): readonly [value: T, set: SetStoredValue<T>, remove: () => void];

type SetStoredValue<T> = (value: T | ((previous: T) => T)) => void;
```

Works like `useState`, but keeps the value in `localStorage` as JSON so it survives reloads.

- `value` is `initialValue` while nothing is stored, when the stored text isn't valid JSON,
  during server rendering and on the first render while hydrating.
- `set` accepts a value or an updater; the updater always receives the latest stored value.
  `remove` deletes the key, so `value` returns to `initialValue`.
- Every hook using the same key updates together, in this page and in other tabs.
- `value` keeps its identity until the stored value changes, and `set`/`remove` keep theirs
  while `key` is unchanged, so all three are safe in effect dependencies.
- If storage is blocked or full, reads fall back to `initialValue` and writes are kept in
  memory for this page instead of throwing.

Values must survive `JSON.stringify`: no functions, `Date`s come back as strings, and
`undefined` is not stored.

```tsx
import { useLocalStorage } from "react-honey-hooks";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  return (
    <button
      onClick={() => {
        setTheme((t) => (t === "light" ? "dark" : "light"));
      }}
    >
      Switch to {theme === "light" ? "dark" : "light"} mode
    </button>
  );
}
```

---

### `useSessionStorage`

```ts
function useSessionStorage<T>(
  key: string,
  initialValue: T,
): readonly [value: T, set: SetStoredValue<T>, remove: () => void];
```

Works exactly like [`useLocalStorage`](#uselocalstorage), but keeps the value in
`sessionStorage`: it survives reloads, but belongs to this tab and is gone when the tab closes.
Hooks using the same key in this tab stay in sync, and the same key in `localStorage` is a
separate value.

```tsx
import { useSessionStorage } from "react-honey-hooks";

function CheckoutSteps() {
  const [step, setStep] = useSessionStorage("checkout-step", 1);

  return (
    <button
      onClick={() => {
        setStep((s) => s + 1);
      }}
    >
      Step {step}: continue
    </button>
  );
}
```

---

### `useMediaQuery`

```ts
function useMediaQuery(query: string, defaultValue?: boolean): boolean;
```

Returns whether the CSS media `query` matches, and re-renders when it starts or stops
matching (for example as the window is resized). Changing `query` between renders switches
to the new query. An invalid query never matches. During server rendering, and on the first
render while hydrating, it returns `defaultValue` (`false` unless given).

```tsx
import { useMediaQuery } from "react-honey-hooks";

function Navigation() {
  const isWide = useMediaQuery("(min-width: 768px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return isWide ? <Sidebar animated={!reduceMotion} /> : <BottomTabs />;
}
```

---

### `useOnlineStatus`

```ts
function useOnlineStatus(): boolean;
```

Returns `navigator.onLine` and re-renders on the browser's `online` and `offline` events.
`false` means the browser has no network connection at all; `true` does not guarantee a
request will succeed. During server rendering, and on the first render while hydrating, it
returns `true`.

```tsx
import { useOnlineStatus } from "react-honey-hooks";

function SaveButton({ onSave }: { onSave: () => void }) {
  const online = useOnlineStatus();

  return (
    <button disabled={!online} onClick={onSave}>
      {online ? "Save" : "Offline: changes will sync later"}
    </button>
  );
}
```

---

### `usePageVisibility`

```ts
function usePageVisibility(): boolean;
```

Returns whether the page is visible, and re-renders when the user switches tabs, minimises
the window or locks the screen (the `visibilitychange` event). Use it to pause polling,
video or animations nobody can see. During server rendering, and on the first render while
hydrating, it returns `true`.

```tsx
import { useEffect } from "react";
import { usePageVisibility } from "react-honey-hooks";

function LivePrices({ refresh }: { refresh: () => void }) {
  const visible = usePageVisibility();

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [visible, refresh]);

  return <PriceTable />;
}
```

---

## Migrating from v2

| v2                                                   | v3                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `const { category } = useQuery()`                    | `const { params: { category } } = useQuery<"category">()`                              |
| `QueryParams` was `Readonly<Record<string, string>>` | `QueryParams<K>` is `Readonly<Partial<Record<K, string>>>` (values may be `undefined`) |
| no way to read repeated keys                         | `useQuery().getAll(key)`                                                               |
| `useClickOutside(ref, handler)`                      | unchanged; also accepts an array of refs and `{ enabled }`                             |
| `useCountdown(target)`                               | unchanged; also accepts `{ onExpire }`. `Countdown` fields are `readonly`              |

## Migrating from v1

| v1                                     | v3                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `useCountdownDate(date)`               | `useCountdown(date)`, which also returns `totalMilliseconds` and `isExpired` |
| `useOnClickOutSide(ref, handler)`      | `useClickOutside(ref, handler)`                                              |
| `useOutsideElement({ ref, callback })` | `useClickOutside(ref, callback)`                                             |
| `useQuery()`                           | `useQuery().params`, which now updates on back/forward navigation            |
| `ParamsType`, `CountDownDateType`      | `QueryParams`, `Countdown`                                                   |

Other changes since v1:

- React 18 or newer is required (the hooks use `useSyncExternalStore`).
- A past or invalid date no longer logs a console error. It is reported as `isExpired: true`.
- `useClickOutside` now listens for touches as well as mouse presses.

## Development

```bash
npm install
npx playwright install chromium firefox webkit   # once, for the e2e tests
npm test          # unit tests: Vitest + jsdom
npm run test:e2e  # builds dist/, then runs it in real Chromium, Firefox and WebKit
npm run check     # typecheck + lint + format check + unit + e2e tests
npm run build     # tsup → dist/ (ESM, CJS, .d.ts)
```

## License

MIT

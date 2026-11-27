# 🍯 React Honey Hooks

Small, typed React hooks. Tree-shakeable, zero dependencies, about 1 kB gzipped, ESM + CJS,
SSR-safe, and tested in real Chromium, Firefox and WebKit.

```bash
npm install react-honey-hooks
```

Requires React 18 or newer.

## Hooks

- [`useQuery`](#usequery): read the URL's query params
- [`useCountdown`](#usecountdown): count down to a date
- [`useClickOutside`](#useclickoutside): detect presses outside an element
- [`useMediaQuery`](#usemediaquery): match a CSS media query

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

The hook does not observe `history.pushState` calls made by client-side routers; use your
router's own hook there.

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

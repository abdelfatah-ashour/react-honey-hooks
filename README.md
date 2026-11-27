# 🍯 React Honey Hooks

Small, typed React hooks. Tree-shakeable, zero dependencies, ESM + CJS, SSR-safe.

```bash
npm install react-honey-hooks
```

Requires React 18 or newer.

## Hooks

- [`useQuery`](#usequery): read the URL's query params
- [`useCountdown`](#usecountdown): count down to a date
- [`useClickOutside`](#useclickoutside): detect presses outside an element

---

### `useQuery`

```ts
function useQuery(): Readonly<Record<string, string>>;
```

Returns the current URL's query string as an object. It re-reads on browser back/forward
navigation (`popstate`) and keeps the same object identity while the URL is unchanged, so
it is safe to use in effect dependencies. During server rendering it returns `{}`.

```tsx
import { useQuery } from "react-honey-hooks";

// https://example.com/products?category=books&sort=price
function Products() {
  const { category = "all", sort } = useQuery();
  return (
    <p>
      Showing {category}, sorted by {sort ?? "relevance"}
    </p>
  );
}
```

For repeated keys (`?tag=a&tag=b`) the last value wins. The hook does not observe
`history.pushState` calls made by client-side routers; use your router's own hook there.

---

### `useCountdown`

```ts
function useCountdown(target: Date | number | string): Countdown;

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isExpired: boolean;
}
```

Updates once per second until `target` is reached, then stops its timer. Remaining time
never goes negative; a past or invalid date is reported as expired.

```tsx
import { useCountdown } from "react-honey-hooks";

const LAUNCH = new Date("2027-01-01T00:00:00Z");

function Launch() {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(LAUNCH);

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
  ref: RefObject<Element | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
): void;
```

Calls `handler` when a mouse press or touch starts outside the referenced element. Presses on
the element or its descendants are ignored. The latest `handler` is always used, so inline
functions are fine and no `useCallback` is needed.

```tsx
import { useRef, useState } from "react";
import { useClickOutside } from "react-honey-hooks";

function Dropdown() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => {
    setOpen(false);
  });

  return (
    <div ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)}>Menu</button>
      {open && <ul>{/* … */}</ul>}
    </div>
  );
}
```

---

## Migrating from v1

| v1                                     | v2                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `useCountdownDate(date)`               | `useCountdown(date)`, which also returns `totalMilliseconds` and `isExpired` |
| `useOnClickOutSide(ref, handler)`      | `useClickOutside(ref, handler)`                                              |
| `useOutsideElement({ ref, callback })` | `useClickOutside(ref, callback)`                                             |
| `useQuery()`                           | `useQuery()`, which now updates on back/forward navigation                   |
| `ParamsType`, `CountDownDateType`      | `QueryParams`, `Countdown`                                                   |

Other changes:

- React 18 or newer is required (the hooks use `useSyncExternalStore`).
- A past or invalid date no longer logs a console error. It is reported as `isExpired: true`.
- `useClickOutside` now listens for touches as well as mouse presses.

## Development

```bash
npm install
npm test          # Vitest, jsdom
npm run check     # typecheck + lint + format check + tests
npm run build     # tsup → dist/ (ESM, CJS, .d.ts)
```

## License

MIT

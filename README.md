# 🍯 React Honey Hooks

Small, typed React hooks. Zero dependencies, ESM + CJS, SSR-safe, and tested in real
Chromium, Firefox and WebKit. Tree-shakeable: all 66 hooks are under 11 kB minified and
gzipped, and your bundle only includes the ones you import.

```bash
npm install react-honey-hooks
```

Requires React 18 or newer.

## Hooks

- [`useQuery`](#usequery): read the URL's query params
- [`useQueryState`](#usequerystate): read and update the URL's query params
- [`useAsync`](#useasync): run async work, keeping only the newest result
- [`useScript`](#usescript): load an external script once
- [`useUndoState`](#useundostate): state with undo and redo
- [`useStep`](#usestep): move through the steps of a wizard
- [`useCountdown`](#usecountdown): count down to a date
- [`useBroadcastChannel`](#usebroadcastchannel): message other tabs of your site
- [`useClickOutside`](#useclickoutside): detect presses outside an element
- [`useScrollLock`](#usescrolllock): stop the page scrolling behind a modal
- [`useFocusTrap`](#usefocustrap): keep keyboard focus inside a modal
- [`useBeforeUnload`](#usebeforeunload): warn before leaving with unsaved changes
- [`useDocumentTitle`](#usedocumenttitle): set the browser tab's title
- [`useFavicon`](#usefavicon): set the browser tab's icon
- [`useCopyToClipboard`](#usecopytoclipboard): copy text and show that it worked
- [`useDebouncedValue`](#usedebouncedvalue): a value that waits for changes to settle
- [`useDebouncedCallback`](#usedebouncedcallback): a function that waits for calls to stop
- [`useDebouncedEffect`](#usedebouncedeffect): an effect that waits for its dependencies to settle
- [`useThrottledCallback`](#usethrottledcallback): a function that runs at most every few ms
- [`useThrottledValue`](#usethrottledvalue): a value that updates at most every few ms
- [`useThrottledEffect`](#usethrottledeffect): an effect that runs at most every few ms
- [`useEventListener`](#useeventlistener): listen to any DOM event, typed
- [`useEventTarget`](#useeventtarget): bind a form field's value to state
- [`useHotkey`](#usehotkey): keyboard shortcuts such as `mod+k`
- [`useLongPress`](#uselongpress): press and hold an element
- [`useFileDrop`](#usefiledrop): accept files dropped onto an element
- [`useHover`](#usehover): know when the pointer is over an element
- [`useFocusWithin`](#usefocuswithin): know when focus is inside an element
- [`useElementSize`](#useelementsize): measure an element as it resizes
- [`useMutationObserver`](#usemutationobserver): react to changes in an element's content
- [`useInView`](#useinview): know when an element scrolls into view
- [`useInterval`](#useinterval): run something every few milliseconds
- [`useRafInterval`](#userafinterval): run something every few milliseconds, on animation frames
- [`useTimeout`](#usetimeout): run something once after a delay
- [`useRafTimeout`](#useraftimeout): run something once after a delay, on an animation frame
- [`useLocalStorage`](#uselocalstorage): state that survives reloads and syncs across tabs
- [`useSessionStorage`](#usesessionstorage): state that survives reloads in this tab only
- [`useMediaQuery`](#usemediaquery): match a CSS media query
- [`useWindowSize`](#usewindowsize): the window's width and height
- [`useWindowScroll`](#usewindowscroll): the page's scroll position
- [`useScroll`](#usescroll): an element's scroll position
- [`useOnlineStatus`](#useonlinestatus): know when the network drops
- [`usePageVisibility`](#usepagevisibility): know when the tab is hidden
- [`useIdle`](#useidle): know when the user stops interacting
- [`usePermission`](#usepermission): whether a browser permission is granted
- [`useGeolocation`](#usegeolocation): the user's position
- [`useWakeLock`](#usewakelock): keep the screen on
- [`useFullscreen`](#usefullscreen): show an element fullscreen
- [`useIsClient`](#useisclient): render browser-only content without a hydration mismatch
- [`usePrefersColorScheme`](#usepreferscolorscheme): follow the system's light or dark mode
- [`usePrefersReducedMotion`](#useprefersreducedmotion): respect the reduced-motion setting
- [`usePrevious`](#useprevious): the value before it last changed
- [`useToggle`](#usetoggle): a boolean with `toggle`, `setTrue` and `setFalse`
- [`useCounter`](#usecounter): a number with `inc`, `dec` and optional limits
- [`useMap`](#usemap): a `Map` in state, with `set` and `remove`
- [`useSet`](#useset): a `Set` in state, with `add`, `remove` and `toggle`
- [`useSetState`](#usesetstate): object state that merges updates
- [`useResetState`](#useresetstate): `useState` with a `reset` back to the initial value
- [`useGetState`](#usegetstate): `useState` with a `getState` that never reads a stale value
- [`useControllableValue`](#usecontrollablevalue): a value a component's parent can control, or not
- [`useCookieState`](#usecookiestate): state kept in a cookie
- [`useSelections`](#useselections): checkboxes for a list, with select all
- [`useDynamicList`](#usedynamiclist): a list of form rows with stable keys
- [`useLatest`](#uselatest): a ref that always holds the latest value
- [`useStableCallback`](#usestablecallback): a callback that never changes but calls the latest code
- [`useMount`](#usemount): run something once when a component mounts
- [`useUnmount`](#useunmount): run something when a component unmounts
- [`useUpdateEffect`](#useupdateeffect): an effect that skips the first render
- [`useLockFn`](#uselockfn): stop an async action running twice at once
- [`useDeepCompareEffect`](#usedeepcompareeffect): an effect that compares dependencies by contents
- [`useAsyncEffect`](#useasynceffect): an async effect, cancelled when it goes stale

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

### `useAsync`

```ts
function useAsync<A extends unknown[], R>(
  fn: (signal: AbortSignal, ...args: A) => Promise<R>,
): AsyncResult<A, R>;

interface AsyncResult<A extends unknown[], R> {
  readonly status: "idle" | "pending" | "success" | "error";
  readonly data: R | undefined; // the last successful result
  readonly error: Error | undefined; // why the last call failed
  readonly run: (...args: A) => Promise<R | undefined>;
  readonly cancel: () => void;
}
```

Runs async work when you call `run`, and tracks its status, result and error.

- `fn` receives an `AbortSignal` first: pass it to `fetch` so abandoned requests stop.
- Starting a new call aborts the one in progress, and only the newest call's result counts, so
  a slow early response can't overwrite a newer one.
- `data` keeps the last successful result while a new call is pending, so the page doesn't
  flash empty. `error` is cleared by the next success.
- `run` resolves to the result, or to `undefined` if the call failed, was superseded or was
  cancelled. It never rejects, so you don't need `catch`.
- `cancel` aborts the call in progress and goes back to the status before it. Unmounting aborts
  it too.
- The latest `fn` is always used, and `run` and `cancel` keep their identity.

To load when a value changes, call `run` from an effect:

```tsx
import { useEffect } from "react";
import { useAsync } from "react-honey-hooks";

function UserCard({ id }: { id: string }) {
  const { status, data, error, run } = useAsync(async (signal, userId: string) => {
    const response = await fetch(`/api/users/${userId}`, { signal });
    if (!response.ok) throw new Error(`Request failed: ${String(response.status)}`);
    return (await response.json()) as User;
  });

  useEffect(() => {
    void run(id);
  }, [run, id]);

  if (status === "error") return <p role="alert">{error?.message}</p>;
  return <p>{data ? data.name : "Loading…"}</p>;
}
```

---

### `useScript`

```ts
function useScript(src: string | null): ScriptStatus;

type ScriptStatus = "idle" | "loading" | "ready" | "error";
```

Loads a third-party script, such as a maps, payments or chat widget, and tells you when it is
ready to use.

- Each `src` gets one async `<script>` tag, shared by every component that asks for it, so
  rendering ten maps loads the library once.
- A `<script>` the page already has for `src`, for example in its HTML, counts as `"ready"`.
- Pass `null` to load nothing yet (`"idle"`), for example until the user opens the widget.
- The tag stays when components unmount: removing it wouldn't unload the code. A script that
  failed stays failed until the page reloads.
- During server rendering it is `"loading"` (or `"idle"` for `null`).

```tsx
import { useScript } from "react-honey-hooks";

function Map({ center }: { center: LatLng }) {
  const status = useScript("https://maps.example.com/sdk.js");

  if (status === "error") return <p>The map couldn't load.</p>;
  if (status !== "ready") return <p>Loading map…</p>;
  return <MapView center={center} />;
}
```

---

### `useUndoState`

```ts
function useUndoState<T>(
  initial: T | (() => T),
  options?: UndoStateOptions,
): readonly [value: T, set: SetUndoState<T>, controls: UndoControls];

type SetUndoState<T> = (value: T | ((previous: T) => T)) => void;

interface UndoStateOptions {
  limit?: number; // how many steps can be undone, default 100
}

interface UndoControls {
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly clearHistory: () => void; // forget the steps, keep the value
}
```

Works like `useState`, and remembers earlier values so they can be undone and redone.

- Each `set` that changes the value adds a step to undo. Setting the value it already has adds
  nothing, and setting a new value after undoing clears the steps to redo.
- Up to `limit` steps are kept, dropping the oldest first. A limit of 0 keeps no history.
- `initial` and `set` accept functions just like `useState`, so to store a function, wrap it:
  `set(() => myFunction)`.
- `set`, `undo`, `redo` and `clearHistory` keep their identity, so they are safe in effect
  dependencies and memoised children.

```tsx
import { useUndoState } from "react-honey-hooks";

function TitleEditor() {
  const [title, setTitle, { undo, redo, canUndo, canRedo }] = useUndoState("Untitled");

  return (
    <>
      <input
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
        }}
      />
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </>
  );
}
```

---

### `useStep`

```ts
function useStep(count: number, options?: StepOptions): Steps;

interface StepOptions {
  initial?: number; // the step to start at, default 0
}

interface Steps {
  readonly step: number; // counted from 0
  readonly next: () => void;
  readonly prev: () => void;
  readonly goTo: (step: number) => void;
  readonly isFirst: boolean;
  readonly isLast: boolean;
}
```

Tracks which of `count` steps is shown, for wizards, onboarding tours and carousels.

- The step always stays in range: `next` on the last step and `prev` on the first do nothing,
  and `goTo` moves to the nearest valid step (`NaN` is ignored).
- If `count` shrinks, for example when an optional step is removed, the step moves to the new
  last step instead of pointing past the end. A `count` below 1 means a single step.
- `next`, `prev` and `goTo` keep their identity.

```tsx
import { useStep } from "react-honey-hooks";

const pages = [<Account />, <Profile />, <Confirm />];

function SignUpWizard() {
  const { step, next, prev, isFirst, isLast } = useStep(pages.length);

  return (
    <>
      {pages[step]}
      <button onClick={prev} disabled={isFirst}>
        Back
      </button>
      <button onClick={next} disabled={isLast}>
        Next
      </button>
    </>
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

### `useBroadcastChannel`

```ts
function useBroadcastChannel<T>(
  name: string,
  onMessage?: (message: T) => void,
): (message: T) => void;
```

Sends and receives messages on the [`BroadcastChannel`](https://developer.mozilla.org/docs/Web/API/BroadcastChannel)
called `name`, which links every tab, window and iframe of the same origin. It returns a `post`
function that keeps its identity for the component's life. The latest `onMessage` receives
messages from everyone else on the channel, but not the hook's own, so it doesn't need to be
memoised.

- Changing `name` moves to that channel, and unmounting closes it.
- Messages are copied with the structured clone algorithm, so send plain data (no functions or
  class instances). They are not type-checked: `T` is what you expect other tabs to send.
- On the server, before mount, after unmount and in browsers without `BroadcastChannel`, `post`
  does nothing.

```tsx
import { useState } from "react";
import { useBroadcastChannel } from "react-honey-hooks";

function CartBadge() {
  const [count, setCount] = useState(0);
  const post = useBroadcastChannel<number>("cart", setCount); // other tabs update this one

  function add() {
    setCount(count + 1);
    post(count + 1); // and this one updates the others
  }

  return <button onClick={add}>Cart: {count}</button>;
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

### `useScrollLock`

```ts
function useScrollLock(locked?: boolean): void; // default true
```

Stops the page from scrolling while `locked` is true, for example while a modal or drawer is
open. Scrolling inside an element with its own overflow, such as the modal, still works.

- It hides the overflow of `<html>`, and pads it by the scrollbar's width so the content
  doesn't jump sideways when the scrollbar disappears.
- Locks are counted: with a dialog open over another dialog, the page stays locked until both
  release it. The page's own inline `overflow` and `padding-right` are restored after the last.
- It does nothing during server rendering.

```tsx
import { useScrollLock } from "react-honey-hooks";

function Drawer({ open, children }: { open: boolean; children: React.ReactNode }) {
  useScrollLock(open);

  return open ? <aside className="drawer">{children}</aside> : null;
}
```

---

### `useFocusTrap`

```ts
function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active?: boolean, // default true
  options?: FocusTrapOptions,
): void;

interface FocusTrapOptions {
  restoreFocus?: boolean; // return focus to where it was when the trap stops, default true
}
```

Keeps keyboard focus inside an element while `active` is true, so keyboard and screen reader
users can't Tab out of an open modal into the page behind it.

- When it becomes active, it focuses the first focusable element inside, or the container itself
  if there is none. If focus is already inside, for example on an `autoFocus` field, it stays.
- Tab on the last element goes to the first, and Shift+Tab on the first goes to the last. Focus
  moving outside, for example by a click, is brought back.
- Disabled, `hidden` and `inert` elements are skipped, and so are elements hidden with CSS.
- When it stops or unmounts, focus returns to the element that had it before, such as the
  button that opened the dialog, unless `restoreFocus` is false.
- With a dialog open over another, only the newest trap acts; closing it hands focus back to
  the one below.

Close the dialog on Escape with [`useHotkey`](#usehotkey), and pair it with
[`useScrollLock`](#usescrolllock). A native `<dialog>` opened with `showModal()` traps focus
itself.

```tsx
import { useRef } from "react";
import { useFocusTrap, useHotkey } from "react-honey-hooks";

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  useHotkey("Escape", onClose, { ignoreInputs: false });

  return (
    <div ref={ref} role="dialog" aria-modal="true">
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

### `useBeforeUnload`

```ts
function useBeforeUnload(enabled?: boolean): void; // default true
```

While `enabled` is true, the browser asks the user to confirm before the page is closed,
reloaded or left for another site, so unsaved work isn't lost by accident.

- Browsers show their own wording; a custom message is no longer supported.
- Only enable it while there really are unsaved changes: some browsers skip the warning on
  pages the user never interacted with, and a page that always warns is annoying.
- It doesn't cover navigation inside a single-page app, which never unloads the page; use your
  router's blocking feature for that.

```tsx
import { useState } from "react";
import { useBeforeUnload } from "react-honey-hooks";

function CommentBox() {
  const [draft, setDraft] = useState("");
  useBeforeUnload(draft.trim() !== "");

  return (
    <textarea
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
    />
  );
}
```

---

### `useDocumentTitle`

```ts
function useDocumentTitle(title: string, options?: DocumentTitleOptions): void;

interface DocumentTitleOptions {
  restoreOnUnmount?: boolean; // default false
}
```

Sets the browser tab's title, and updates it whenever `title` changes. With
`restoreOnUnmount`, the title from before the component mounted comes back when it unmounts,
which suits a temporary title such as an unread count or "Unsaved changes". The option is
read when the component unmounts. It does nothing during server rendering.

In React 19 you can also render `<title>` anywhere in your components. This hook also works in
React 18, and can restore the previous title.

```tsx
import { useDocumentTitle } from "react-honey-hooks";

function Inbox({ unread }: { unread: number }) {
  useDocumentTitle(unread > 0 ? `Inbox (${String(unread)})` : "Inbox", {
    restoreOnUnmount: true,
  });

  return <MessageList />;
}
```

---

### `useFavicon`

```ts
function useFavicon(href: string | null): void;
```

Sets the page's favicon to `href`, such as to show unread messages. `null` leaves the page's
own icon. Every `<link rel="icon">` in the head is pointed at `href`, with a `type` taken from
its file extension (none for an unknown extension or a `data:` URL), and a link is added if
there are none. When `href` becomes `null` or the component unmounts, the links go back to what
they were and an added link is removed. Nothing happens on the server.

```tsx
import { useFavicon } from "react-honey-hooks";

function Inbox({ unread }: { unread: number }) {
  useFavicon(unread > 0 ? "/favicon-unread.svg" : null);
  return <MessageList />;
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

### `useDebouncedEffect`

```ts
function useDebouncedEffect(effect: EffectCallback, deps: DependencyList, ms: number): void;
```

An effect that waits for its dependencies to settle: `effect` runs once `deps` have stopped
changing for `ms`, such as a search request after the user stops typing. It doesn't run on
mount, only after `deps` change. Each change restarts the wait, and so does changing `ms`.
When it runs, it uses the latest `effect`. The cleanup `effect` returns runs before the next
run and on unmount, and a pending run is dropped on unmount. With `ms` of 0 or less (or `NaN`)
it runs on every change with no delay.

```tsx
import { useState } from "react";
import { useDebouncedEffect } from "react-honey-hooks";

function Search() {
  const [query, setQuery] = useState("");

  useDebouncedEffect(
    () => {
      void search(query);
    },
    [query],
    300,
  );

  return (
    <input
      value={query}
      onChange={(event) => {
        setQuery(event.target.value);
      }}
    />
  );
}
```

---

### `useThrottledCallback`

```ts
function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
  options?: ThrottleOptions,
): ThrottledFunction<A>;

interface ThrottleOptions {
  leading?: boolean; // run the call that starts a wait at once; default true
  trailing?: boolean; // run the last call made during a wait when it ends; default true
}

interface ThrottledFunction<A extends unknown[]> {
  (...args: A): void;
  readonly cancel: () => void; // drop the pending call and end the wait
  readonly flush: () => void; // run the pending call now and end the wait
}
```

Returns a function that runs `fn` at most once every `ms`, however often it is called. Where
[`useDebouncedCallback`](#usedebouncedcallback) waits for calls to stop, this keeps running
at a steady rate while they continue: good for scroll, resize and pointer handlers, or saving
while someone types.

- The first call runs at once and starts a wait. Calls during the wait collapse into one call
  with the last arguments when it ends, which starts a new wait, so `fn` never runs closer
  than `ms` apart.
- `leading: false` makes the first call wait too; `trailing: false` drops calls made during
  the wait. With both off, `fn` never runs.
- A delay of 0 or less (or `NaN`) doesn't throttle. With `Infinity`, later calls wait for
  `flush` or `cancel`.
- The latest `fn` and options are always used, so inline functions are fine. The returned
  function keeps its identity, and a pending call is dropped when the component unmounts.

```tsx
import { useThrottledCallback } from "react-honey-hooks";

function ScrollSpy({ onProgress }: { onProgress: (percent: number) => void }) {
  const report = useThrottledCallback(onProgress, 100);

  return (
    <div
      style={{ overflow: "auto", height: 400 }}
      onScroll={(event) => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        report((scrollTop / (scrollHeight - clientHeight)) * 100);
      }}
    >
      {/* long content */}
    </div>
  );
}
```

---

### `useThrottledValue`

```ts
function useThrottledValue<T>(value: T, ms: number): T;
```

Returns `value`, updated at most once every `ms`. Use it for values that change very often,
such as a scroll position or pointer coordinates, when a little lag is fine but waiting for
them to stop, as [`useDebouncedValue`](#usedebouncedvalue) does, is not. The first value is
returned at once, and so is the first change. Changes during the wait that follows collapse
into one update with the latest value when it ends. With `ms` of 0 or less (or `NaN`) it follows
`value` straight away. A pending update is dropped when the component unmounts.

```tsx
import { useThrottledValue, useWindowScroll } from "react-honey-hooks";

function ReadingProgress() {
  const { y } = useWindowScroll();
  const throttledY = useThrottledValue(y, 100);
  return <ProgressBar value={throttledY} />;
}
```

---

### `useThrottledEffect`

```ts
function useThrottledEffect(effect: EffectCallback, deps: DependencyList, ms: number): void;
```

An effect that runs at most once every `ms`, for dependencies that change very often, such as a
scroll position. It doesn't run on mount, only after `deps` change. The first change runs it at
once and starts a wait. Changes during the wait collapse into one run, with the latest
`effect`, when it ends, and that run starts a new wait. The cleanup `effect` returns runs
before the next run and on unmount, and a pending run is dropped on unmount. With `ms` of 0 or
less (or `NaN`) it runs on every change with no delay.

```tsx
import { useThrottledEffect, useWindowScroll } from "react-honey-hooks";

function Article({ id }: { id: string }) {
  const { y } = useWindowScroll();

  useThrottledEffect(
    () => {
      saveReadingPosition(id, y);
    },
    [id, y],
    1000,
  );

  return <ArticleBody id={id} />;
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

### `useEventTarget`

```ts
function useEventTarget(options: { initialValue: string }): readonly [string, EventTargetActions];
function useEventTarget(options: { initialValue: boolean }): readonly [boolean, EventTargetActions];
function useEventTarget<T>(options: {
  initialValue: T;
  transform: (value: FieldValue) => T;
}): readonly [T, EventTargetActions];

type FieldValue = string | boolean;

interface EventTargetActions {
  onChange: (event: { target: EventTarget | null }) => void;
  reset: () => void;
}
```

State bound to a form field: pass `value` and `onChange` to an `<input>`, `<textarea>` or
`<select>`. `onChange` reads the field's `value`, or a checkbox's `checked` state, and
`transform` maps it to the value to keep, such as text to a number. `reset` goes back to
`initialValue`. Events from elements with no value are ignored. `onChange` and `reset` never
change, and the latest `transform` is always used.

```tsx
import { useEventTarget } from "react-honey-hooks";

function Order() {
  const [name, nameField] = useEventTarget({ initialValue: "" });
  const [quantity, quantityField] = useEventTarget({
    initialValue: 1,
    transform: (value) => Math.max(1, Number(value) || 1),
  });

  return (
    <>
      <input value={name} onChange={nameField.onChange} />
      <input type="number" value={quantity} onChange={quantityField.onChange} />
    </>
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

### `useLongPress`

```ts
function useLongPress(
  ref: RefObject<HTMLElement | null>,
  handler: (event: PointerEvent) => void,
  options?: LongPressOptions,
): void;

interface LongPressOptions {
  delayMs?: number; // how long to hold, default 500
  enabled?: boolean; // default true
}
```

Calls `handler` with the `pointerdown` event when the element is pressed and held for
`delayMs`, with the main mouse button, a pen or one finger.

- Releasing, leaving the element or moving more than 10 px before `delayMs` cancels the press,
  so scrolling and dragging don't trigger it. Other mouse buttons and second fingers are
  ignored.
- The click that follows a long press is cancelled, so one element can have a click action
  and a long-press action.
- Setting `enabled` to `false` cancels a press in progress. A delay that isn't a finite number
  of 0 or more never fires.
- The latest `handler` is always called, so inline functions are fine.

Only pointer presses count, so give keyboard users another way to reach the same action, for
example a menu button.

```tsx
import { useRef } from "react";
import { useLongPress } from "react-honey-hooks";

function MessageBubble({ onOpen, onShowActions }: MessageBubbleProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useLongPress(ref, onShowActions);

  return (
    <button ref={ref} onClick={onOpen}>
      …
    </button>
  );
}
```

---

### `useFileDrop`

```ts
function useFileDrop(
  ref: RefObject<HTMLElement | null>,
  onDrop: (accepted: File[], rejected: File[]) => void,
  options?: FileDropOptions,
): FileDrop;

interface FileDropOptions {
  accept?: string; // as in <input type="file" accept>, e.g. "image/*,.pdf"; default any file
  multiple?: boolean; // default true; false accepts only the first file
  enabled?: boolean; // default true
}

interface FileDrop {
  readonly isOver: boolean; // whether files are being dragged over the element
}
```

Turns an element into a drop zone for files.

- `isOver` is true while files are dragged over it, and doesn't flicker as the pointer crosses
  its children, so it is safe for highlighting the zone.
- `onDrop` receives the dropped files split by `accept`, which takes MIME types (`image/png`),
  wildcards (`image/*`) and extensions (`.pdf`, any case). With `multiple: false`, only the
  first accepted file is accepted.
- Drags without files, such as selected text or links, are ignored, and a dropped file isn't
  opened by the browser in place of your page.
- The latest `onDrop` is always called, so inline functions are fine.

Keep a file `<input>` as well, so people who can't drag, including keyboard users, can choose
files too.

```tsx
import { useRef } from "react";
import { useFileDrop } from "react-honey-hooks";

function AvatarUpload({ upload }: { upload: (file: File) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isOver } = useFileDrop(
    ref,
    (accepted, rejected) => {
      if (accepted[0]) upload(accepted[0]);
      if (rejected.length > 0) alert("Please drop a single image.");
    },
    { accept: "image/*", multiple: false },
  );

  return (
    <div ref={ref} className={isOver ? "drop-zone active" : "drop-zone"}>
      Drop a photo here
    </div>
  );
}
```

---

### `useHover`

```ts
function useHover(ref: RefObject<Element | null>): boolean;
```

Returns whether a mouse or pen pointer is over the element, including over its children.

- Touch is ignored: touch screens have no hover, and a tap would otherwise leave it `true`.
- It is `false` during server rendering and when the pointer leaves the window.
- It checks the ref's current element as the pointer moves, so it follows the ref to a new
  element.

For purely visual effects, CSS `:hover` is simpler. Use this when hovering changes what
renders, for example to load a preview.

```tsx
import { useRef } from "react";
import { useHover } from "react-honey-hooks";

function UserLink({ user }: { user: User }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hovered = useHover(ref);

  return (
    <a ref={ref} href={user.url}>
      {user.name}
      {hovered && <ProfilePreview userId={user.id} />}
    </a>
  );
}
```

---

### `useFocusWithin`

```ts
function useFocusWithin(ref: RefObject<Element | null>): boolean;
```

Returns whether focus is on the element or anywhere inside it, the same as CSS `:focus-within`,
and re-renders as focus moves in and out, by keyboard or by mouse.

- It is right from the first render when focus starts inside, for example on an `autoFocus`
  field.
- It checks the ref's current element, so it follows the ref to a new element.
- It is `false` during server rendering.

For styling alone, CSS `:focus-within` is simpler. Use this when focus changes what renders,
such as showing a search box's suggestions only while you're in it.

```tsx
import { useRef } from "react";
import { useFocusWithin } from "react-honey-hooks";

function SearchBox() {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useFocusWithin(ref);

  return (
    <div ref={ref}>
      <input type="search" aria-label="Search" />
      {focused && <Suggestions />}
    </div>
  );
}
```

---

### `useMutationObserver`

```ts
function useMutationObserver(
  ref: RefObject<Element | null>,
  callback: MutationCallback, // (mutations: MutationRecord[], observer) => void
  options?: MutationObserverInit, // default { childList: true, subtree: true }
): void;
```

Calls `callback` when the element's content changes, using a `MutationObserver`. Use it to
react to DOM that React doesn't control, such as a third-party widget or an editor.

- By default it reports children added or removed anywhere inside. Pass `options` to watch
  attributes (`attributes`, `attributeFilter`) or text (`characterData`) instead.
- Options are compared by value, so writing them inline is fine. Options that watch nothing
  throw the browser's `TypeError`.
- The latest `callback` is always called, so inline functions are fine.
- It follows the ref to a new element, and disconnects on unmount.

```tsx
import { useRef, useState } from "react";
import { useMutationObserver } from "react-honey-hooks";

function ChatWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);
  useMutationObserver(ref, (mutations) => {
    const added = mutations.reduce((count, mutation) => count + mutation.addedNodes.length, 0);
    setUnread((count) => count + added);
  });

  return <div ref={ref} id="third-party-chat" aria-label={`${String(unread)} new messages`} />;
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

### `useRafInterval`

```ts
function useRafInterval(callback: () => void, ms: number | null): void;
```

[`useInterval`](#useinterval) timed with animation frames: calls `callback` on the first frame
each time `ms` has passed since the last call, or since it started. Browsers pause frames while
the tab is hidden, so it stops in the background, and when the tab is shown again it calls once
instead of catching up on every missed call. That suits animation and other visual work. Pass
`null` to pause; 0, a negative, `NaN` or an infinite `ms` also pauses. Resuming or changing
`ms` counts from zero again. The latest `callback` is always called without restarting, so it
need not be memoised. Nothing runs on the server.

```tsx
import { useState } from "react";
import { useRafInterval } from "react-honey-hooks";

function Slideshow({ slides }: { slides: string[] }) {
  const [index, setIndex] = useState(0);
  useRafInterval(() => {
    setIndex((current) => (current + 1) % slides.length);
  }, 5000);
  return <img src={slides[index]} alt="" />;
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

### `useRafTimeout`

```ts
function useRafTimeout(callback: () => void, ms: number | null): void;
```

[`useTimeout`](#usetimeout) timed with animation frames: calls `callback` once, on the first
frame at least `ms` after mounting. Browsers pause frames while the tab is hidden, so it waits
until the tab is shown instead of firing in the background, which suits visual work. Changing
`ms` starts the wait again from now. `null`, or a negative, `NaN` or infinite `ms`, cancels it
until a valid one is given, and 0 calls it on the next frame. The latest `callback` is always
called, so it need not be memoised. Nothing runs on the server.

```tsx
import { useState } from "react";
import { useRafTimeout } from "react-honey-hooks";

function SavedToast() {
  const [visible, setVisible] = useState(true);
  useRafTimeout(
    () => {
      setVisible(false);
    },
    visible ? 3000 : null,
  );
  return visible && <p role="status">Saved</p>;
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

### `useWindowSize`

```ts
function useWindowSize(serverSize?: WindowSize): WindowSize;

interface WindowSize {
  readonly width: number;
  readonly height: number;
}
```

Returns the window's `innerWidth` and `innerHeight`, which include any scrollbar, and
re-renders when the window is resized. It returns the same object while the size is unchanged.

During server rendering and on the first render while hydrating it returns `serverSize`
(`0 × 0` by default), then the real size, so hydration never mismatches. To switch layouts at
a breakpoint, prefer [`useMediaQuery`](#usemediaquery), which only re-renders when the
breakpoint is crossed.

```tsx
import { useWindowSize } from "react-honey-hooks";

function Confetti() {
  const { width, height } = useWindowSize();

  return <canvas width={width} height={height} />;
}
```

---

### `useWindowScroll`

```ts
function useWindowScroll(): WindowScroll;

interface WindowScroll {
  readonly x: number;
  readonly y: number;
}
```

Returns how far the page is scrolled, in CSS pixels, and re-renders as it scrolls.

- It updates at most once per animation frame, however many scroll events the browser sends,
  so it stays cheap during fast scrolling.
- During server rendering and on the first render while hydrating it is `{ x: 0, y: 0 }`, so
  hydration never mismatches.
- It returns the same object while the position is unchanged.

To show something when an element scrolls into view, [`useInView`](#useinview) is cheaper: it
only re-renders when the element enters or leaves.

```tsx
import { useWindowScroll } from "react-honey-hooks";

function BackToTop() {
  const { y } = useWindowScroll();

  if (y < 800) return null;
  return (
    <button
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      Back to top
    </button>
  );
}
```

---

### `useScroll`

```ts
function useScroll(ref: RefObject<Element | null>): ScrollPosition;

interface ScrollPosition {
  readonly x: number;
  readonly y: number;
}
```

Returns how far the element held by `ref` is scrolled, `{ x, y }` in CSS pixels, and
re-renders as it scrolls, at most once per animation frame. For the page itself, use
[`useWindowScroll`](#usewindowscroll). It is `{ x: 0, y: 0 }` on the server and until there is an
element, keeps the last position while the ref holds no element, and returns the same object
while the position is unchanged. It follows the ref to a new element after a render, and stops
listening when the component unmounts.

```tsx
import { useRef } from "react";
import { useScroll } from "react-honey-hooks";

function Chat() {
  const messages = useRef<HTMLDivElement>(null);
  const { y } = useScroll(messages);

  return (
    <div ref={messages} style={{ overflow: "auto" }}>
      {y > 200 && <JumpToTopButton />}
      <MessageList />
    </div>
  );
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

### `usePrevious`

```ts
function usePrevious<T>(value: T): T | undefined;
```

Returns the value `value` had before it last changed, or `undefined` until it first changes.
Re-renders that pass the same value (compared with `Object.is`) don't move it on, so unrelated
state updates don't lose the previous value. Objects are compared by identity.

```tsx
import { usePrevious } from "react-honey-hooks";

function Price({ amount }: { amount: number }) {
  const previousAmount = usePrevious(amount);
  const trend = previousAmount === undefined ? "" : amount > previousAmount ? "up" : "down";

  return <span className={trend}>{amount}</span>;
}
```

---

### `useToggle`

```ts
function useToggle(initial?: boolean): readonly [boolean, ToggleActions];

interface ToggleActions {
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  set: (value: boolean) => void;
}
```

A boolean state with named setters, starting at `initial` (`false` unless given). The actions
object and its functions never change, so they are safe to pass to memoised children or list in
effect dependencies. `toggle` ignores its arguments, so it can be passed straight to `onClick`,
and calling it several times in one event flips the value once per call.

```tsx
import { useToggle } from "react-honey-hooks";

function Faq() {
  const [open, { toggle, setFalse }] = useToggle();

  return (
    <>
      <button aria-expanded={open} onClick={toggle}>
        Shipping
      </button>
      {open && <Answer onClose={setFalse} />}
    </>
  );
}
```

---

### `useCounter`

```ts
function useCounter(initial?: number, options?: CounterOptions): readonly [number, CounterActions];

interface CounterOptions {
  min?: number;
  max?: number;
}

interface CounterActions {
  inc: (delta?: number) => void;
  dec: (delta?: number) => void;
  set: (value: number | ((current: number) => number)) => void;
  reset: () => void;
}
```

A number starting at `initial` (0 unless given) that always stays within `min` and `max`:
`inc` and `dec` stop at the limits, `set` keeps its value in range, an initial value outside
the limits starts at the nearest one, and if the limits change the count moves into the new
range. `reset` goes back to the initial value from the first render. `NaN` is ignored. `inc`
and `dec` step by 1 unless given a number, so they can be passed straight to `onClick`. The
actions object and its functions never change and always use the latest limits.

```tsx
import { useCounter } from "react-honey-hooks";

function Quantity() {
  const [quantity, { inc, dec }] = useCounter(1, { min: 1, max: 10 });

  return (
    <>
      <button onClick={dec} disabled={quantity === 1}>
        −
      </button>
      {quantity}
      <button onClick={inc} disabled={quantity === 10}>
        +
      </button>
    </>
  );
}
```

---

### `useMap`

```ts
function useMap<K, V>(
  entries?: Iterable<readonly [K, V]>,
): readonly [ReadonlyMap<K, V>, MapActions<K, V>];

interface MapActions<K, V> {
  set: (key: K, value: V) => void;
  setAll: (entries: Iterable<readonly [K, V]>) => void;
  remove: (key: K) => void;
  clear: () => void;
  reset: () => void;
}
```

A `Map` held in state, starting with `entries`. It is never changed in place: each change gives
a new map, so it works as an effect dependency or a memoised prop. An action that changes
nothing, such as setting a key to the value it already has (compared with `Object.is`) or
removing a missing key, keeps the same map and doesn't re-render. `reset` goes back to the
entries from the first render. The actions object and its functions never change.

```tsx
import { useMap } from "react-honey-hooks";

function Basket({ fruits }: { fruits: string[] }) {
  const [basket, { set, remove }] = useMap<string, number>();

  return fruits.map((fruit) => (
    <p key={fruit}>
      {fruit}: {basket.get(fruit) ?? 0}
      <button onClick={() => set(fruit, (basket.get(fruit) ?? 0) + 1)}>Add</button>
      <button onClick={() => remove(fruit)}>Remove</button>
    </p>
  ));
}
```

---

### `useSet`

```ts
function useSet<T>(values?: Iterable<T>): readonly [ReadonlySet<T>, SetActions<T>];

interface SetActions<T> {
  add: (value: T) => void;
  remove: (value: T) => void;
  toggle: (value: T) => void;
  clear: () => void;
  reset: () => void;
}
```

A `Set` held in state, starting with `values`. It is never changed in place: each change gives
a new set, so it works as an effect dependency or a memoised prop. An action that changes
nothing, such as adding a value that is already there or removing a missing one, keeps the same
set and doesn't re-render. `reset` goes back to the values from the first render. The actions
object and its functions never change.

```tsx
import { useSet } from "react-honey-hooks";

function Toppings({ toppings }: { toppings: string[] }) {
  const [chosen, { toggle }] = useSet<string>();

  return toppings.map((topping) => (
    <label key={topping}>
      <input
        type="checkbox"
        checked={chosen.has(topping)}
        onChange={() => {
          toggle(topping);
        }}
      />
      {topping}
    </label>
  ));
}
```

---

### `useSetState`

```ts
function useSetState<T extends object>(initial: T | (() => T)): readonly [T, SetMergedState<T>];

type SetMergedState<T> = (patch: StatePatch<T>) => void;
type StatePatch<T> = Partial<T> | ((current: T) => Partial<T>);
```

Object state that merges updates, like a class component's `setState`. `setState(patch)`
shallowly merges `patch` into the state, keeping the other keys, and `setState(current =>
patch)` computes the patch from the current state, so several updates in one event all apply.
A patch that changes nothing, such as an empty object or values the state already has (compared
with `Object.is`), keeps the same state object and doesn't re-render. `initial` can be a
function, called once. `setState` never changes.

```tsx
import { useSetState } from "react-honey-hooks";

function SignUp() {
  const [form, setForm] = useSetState({ name: "", email: "" });

  return (
    <>
      <input
        value={form.name}
        onChange={(event) => {
          setForm({ name: event.target.value });
        }}
      />
      <input
        value={form.email}
        onChange={(event) => {
          setForm({ email: event.target.value });
        }}
      />
    </>
  );
}
```

---

### `useResetState`

```ts
function useResetState<T>(
  initial: T | (() => T),
): readonly [T, Dispatch<SetStateAction<T>>, () => void];
```

`useState` with a third item, `reset`, which goes back to the initial value. `initial` can be a
function, called once; `reset` reuses its result instead of calling it again. Like `useState`,
it keeps the first render's initial value and ignores later ones. `setState` and `reset` never
change.

```tsx
import { useResetState } from "react-honey-hooks";

function Note() {
  const [text, setText, reset] = useResetState("Buy milk");

  return (
    <>
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <button onClick={reset}>Discard changes</button>
    </>
  );
}
```

---

### `useGetState`

```ts
function useGetState<T>(initial: T | (() => T)): readonly [T, Dispatch<SetStateAction<T>>, () => T];
```

`useState` with a third item, `getState`, which returns the latest value. It sees each update
as soon as `setState` is called, before the re-render, so a callback created on an earlier
render, such as a listener added once on mount, never reads a stale value. Functional updates
apply to that latest value. `initial` can be a function, called once. `setState` and `getState`
never change.

```tsx
import { useEffect } from "react";
import { useGetState } from "react-honey-hooks";

function Clicks() {
  const [count, setCount, getCount] = useGetState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log("Clicks so far:", getCount());
    }, 5000);
    return () => {
      clearInterval(id);
    };
  }, [getCount]);

  return (
    <button
      onClick={() => {
        setCount((current) => current + 1);
      }}
    >
      Clicked {count} times
    </button>
  );
}
```

---

### `useControllableValue`

```ts
function useControllableValue<T>(
  props: ControllableValueProps<T>,
): readonly [T, SetControllableValue<T>]; // T | undefined when there's no value or defaultValue

interface ControllableValueProps<T> {
  value?: T | undefined;
  defaultValue?: T | undefined;
  onChange?: ((value: T) => void) | undefined;
}

type SetControllableValue<T> = (next: T | ((current: T) => T)) => void;
```

For components that can be controlled, like `<input value onChange>`, or uncontrolled, like
`<input defaultValue>`. When `value` is not `undefined`, the component is controlled: it shows
`value`, and `setValue` only calls `onChange` for the parent to apply. Otherwise it keeps its
own value, starting at `defaultValue`, and `setValue` updates it and calls `onChange`.
`setValue` takes a value or a function of the current value. `onChange` is called on every
`setValue`, even with the same value. If the parent stops passing `value`, the component keeps
the last value it was given. The latest `onChange` is always used, so it need not be memoised,
and `setValue` never changes.

```tsx
import { type ControllableValueProps, useControllableValue } from "react-honey-hooks";

function Rating(props: ControllableValueProps<number>) {
  const [stars = 0, setStars] = useControllableValue(props);

  return [1, 2, 3, 4, 5].map((value) => (
    <button
      key={value}
      aria-pressed={value <= stars}
      onClick={() => {
        setStars(value);
      }}
    >
      ★
    </button>
  ));
}

// <Rating defaultValue={3} /> keeps its own value;
// <Rating value={stars} onChange={setStars} /> is controlled.
```

---

### `useCookieState`

```ts
function useCookieState(
  name: string,
  options?: CookieStateOptions,
): readonly [string | undefined, SetCookieState]; // string when there's a defaultValue

interface CookieStateOptions extends CookieOptions {
  defaultValue?: string;
}

interface CookieOptions {
  path?: string; // "/" unless given
  domain?: string;
  maxAge?: number; // seconds
  expires?: Date;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
}

type SetCookieState = (
  value: string | undefined | ((current: string | undefined) => string | undefined),
  options?: CookieOptions,
) => void;
```

The value of the cookie `name`, or `defaultValue` while it is missing. `setValue` writes the
cookie with the hook's cookie options, which a call can override, and `setValue(undefined)`
deletes it. Without `maxAge` or `expires` the cookie lasts for the browser session. Names and
values are percent-encoded, so any text round-trips, and cookies written unencoded by other code
can still be read.

Every hook reading the same cookie updates when one of them writes it. Cookies changed in other
ways, such as by the server or by other code, are only seen on the next render. On the server
and while hydrating, the value is `defaultValue`, so there is no hydration mismatch. Where the
page may not use cookies, such as in a sandboxed iframe, the value stays `defaultValue` and
writes do nothing. `setValue` never changes and always uses the latest name and options.

```tsx
import { useCookieState } from "react-honey-hooks";

function CookieBanner() {
  const [consent, setConsent] = useCookieState("consent", {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  if (consent) return null;
  return (
    <div role="dialog">
      <button
        onClick={() => {
          setConsent("accepted");
        }}
      >
        Accept
      </button>
    </div>
  );
}
```

---

### `useSelections`

```ts
function useSelections<T>(items: readonly T[], options?: SelectionsOptions<T>): Selections<T>;

interface SelectionsOptions<T> {
  defaultSelected?: readonly T[];
  getKey?: (item: T) => unknown; // the item itself unless given
}

interface Selections<T> {
  readonly selected: T[];
  readonly isSelected: (item: T) => boolean;
  readonly select: (item: T) => void;
  readonly unselect: (item: T) => void;
  readonly toggle: (item: T) => void;
  readonly selectAll: () => void;
  readonly unselectAll: () => void;
  readonly toggleAll: () => void;
  readonly setSelected: (items: readonly T[]) => void;
  readonly allSelected: boolean;
  readonly noneSelected: boolean;
  readonly partiallySelected: boolean;
}
```

Tracks which of `items` are selected, as for a list of checkboxes with a select-all box. Items
are matched by `getKey`, such as `(row) => row.id`, so the selection survives new objects for
the same items, such as after a refetch. `selected` lists only the selected items that are in
`items`, in their order; an item that leaves the list and comes back is still selected.
`selectAll` selects every item, `unselectAll` clears the selection, and `toggleAll` does one or
the other. `partiallySelected` is the select-all box's indeterminate state. With no items,
`allSelected` is `false`. The actions never change and always use the latest `items` and
`getKey`.

```tsx
import { useSelections } from "react-honey-hooks";

function Inbox({ emails }: { emails: Email[] }) {
  const { isSelected, toggle, toggleAll, allSelected, partiallySelected } = useSelections(emails, {
    getKey: (email) => email.id,
  });

  return (
    <>
      <input
        type="checkbox"
        checked={allSelected}
        ref={(box) => {
          if (box) box.indeterminate = partiallySelected;
        }}
        onChange={toggleAll}
      />
      {emails.map((email) => (
        <input
          key={email.id}
          type="checkbox"
          checked={isSelected(email)}
          onChange={() => {
            toggle(email);
          }}
        />
      ))}
    </>
  );
}
```

---

### `useDynamicList`

```ts
function useDynamicList<T>(initial?: readonly T[]): DynamicList<T>;

interface DynamicList<T> {
  readonly list: readonly T[];
  readonly getKey: (index: number) => number | undefined;
  readonly insert: (index: number, item: T) => void;
  readonly push: (item: T) => void;
  readonly unshift: (item: T) => void;
  readonly remove: (index: number) => void;
  readonly replace: (index: number, item: T) => void;
  readonly move: (from: number, to: number) => void;
  readonly pop: () => void;
  readonly shift: () => void;
  readonly reset: (list?: readonly T[]) => void;
}
```

A list for forms whose rows are added, removed and reordered. `getKey(index)` gives each item
a key that follows it when other items are added, removed or moved, so React keeps each row's
inputs and state with the right item. Use it as the row's `key` instead of the index.
`replace` keeps the item's key, and `reset` replaces the list with `list`, or the first
render's list, giving every item a new key.

An index that isn't a whole number within the list is ignored (`insert` also accepts the
list's length, to add at the end), as are `pop` and `shift` on an empty list. The list then
stays the same array. Several updates in one event apply in turn. The functions other than
`getKey` never change.

```tsx
import { useDynamicList } from "react-honey-hooks";

function Guests() {
  const { list, getKey, push, remove, replace } = useDynamicList([""]);

  return (
    <>
      {list.map((name, index) => (
        <div key={getKey(index)}>
          <input
            value={name}
            onChange={(event) => {
              replace(index, event.target.value);
            }}
          />
          <button
            onClick={() => {
              remove(index);
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={() => {
          push("");
        }}
      >
        Add guest
      </button>
    </>
  );
}
```

---

### `useLatest`

```ts
function useLatest<T>(value: T): RefObject<T>;
```

Returns a ref holding the latest `value`, for reading in effects, timers and event handlers
without listing `value` as a dependency. The ref is the same object on every render. It is
updated once a render commits, before any effects run (children's included), so read it there
rather than while rendering.

```tsx
import { useEffect } from "react";
import { useLatest } from "react-honey-hooks";

function Autosave({ draft }: { draft: string }) {
  const latestDraft = useLatest(draft);

  useEffect(() => {
    const id = setInterval(() => {
      save(latestDraft.current);
    }, 10_000);
    return () => {
      clearInterval(id);
    };
  }, [latestDraft]);

  return null;
}
```

---

### `useStableCallback`

```ts
function useStableCallback<T, A extends unknown[], R>(
  fn: (this: T, ...args: A) => R,
): (this: T, ...args: A) => R;
```

Returns a function that keeps its identity for the component's whole life and always calls the
latest `fn`, passing on its arguments and `this` and returning its result. Pass it to memoised
children or list it in effect dependencies without them re-rendering or re-running whenever
`fn` changes. It is updated once a render commits, before any effects run, so call it from
effects and event handlers rather than while rendering.

```tsx
import { memo, useState } from "react";
import { useStableCallback } from "react-honey-hooks";

const Row = memo(function Row({ onPick }: { onPick: () => void }) {
  return <button onClick={onPick}>Pick</button>;
});

function Picker() {
  const [count, setCount] = useState(0);
  // `Row` doesn't re-render when `count` changes, yet each click sees the latest count.
  const onPick = useStableCallback(() => {
    setCount(count + 1);
  });
  return <Row onPick={onPick} />;
}
```

---

### `useMount`

```ts
function useMount(fn: () => unknown): void;
```

Calls `fn` once, after the component first mounts. Later renders don't call it again, even
with a different `fn`. `fn` can be async: what it returns is ignored rather than treated as a
cleanup (use [`useUnmount`](#useunmount) for that). Like any effect, it doesn't run on the
server, and React's development Strict Mode runs it twice.

```tsx
import { useMount } from "react-honey-hooks";

function Dashboard() {
  useMount(() => {
    analytics.track("dashboard_viewed");
  });
  return <Charts />;
}
```

---

### `useUnmount`

```ts
function useUnmount(fn: () => unknown): void;
```

Calls the latest `fn` when the component unmounts, and at no other time. `fn` need not be
memoised, so it can read the latest props and state, and it can be async. Like any effect
cleanup, it doesn't run on the server, and React's development Strict Mode also runs it after
its extra mount.

```tsx
import { useUnmount } from "react-honey-hooks";

function Editor({ draft }: { draft: string }) {
  useUnmount(() => {
    saveDraft(draft);
  });
  return <DraftEditor draft={draft} />;
}
```

---

### `useUpdateEffect`

```ts
function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void;
```

`useEffect` that skips the first render: `effect` runs only when `deps` change after the
component mounts, or after every later render when there are no `deps`. Its cleanup runs before
the next run and on unmount, as with `useEffect`. React's development Strict Mode, which mounts,
unmounts and mounts again, doesn't count as an update.

```tsx
import { useUpdateEffect } from "react-honey-hooks";

function Settings({ volume }: { volume: number }) {
  // Not on load: only once the user changes the volume.
  useUpdateEffect(() => {
    toast(`Volume set to ${String(volume)}`);
  }, [volume]);
  return <VolumeSlider />;
}
```

---

### `useLockFn`

```ts
function useLockFn<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | undefined>;
```

Wraps an async function so only one call runs at a time, such as a payment button clicked
twice. While a call is running, further calls are ignored: they don't call `fn` and resolve to
`undefined`. Once the call settles, the lock is released whether it succeeded or failed, and a
failure is passed on to whoever made the call. The returned function keeps its identity for the
component's lifetime and always calls the latest `fn`.

```tsx
import { useLockFn } from "react-honey-hooks";

function PayButton({ orderId }: { orderId: string }) {
  const pay = useLockFn(async () => {
    await api.pay(orderId);
  });
  return <button onClick={() => void pay()}>Pay</button>;
}
```

---

### `useDeepCompareEffect`

```ts
function useDeepCompareEffect(effect: EffectCallback, deps: DependencyList): void;
```

`useEffect` that compares `deps` by their contents rather than by identity, so a new object or
array with the same data, such as one created during render, doesn't re-run the effect.
Primitives are compared with `Object.is`; arrays and plain objects key by key, deeply; dates by
time; regular expressions by source and flags; maps by keys and (deeply) values; and sets by
members. Other objects, such as class instances, must be the same object. The cleanup runs
before each re-run and on unmount, as with `useEffect`. Every render walks the whole of `deps`,
so keep them to plain, modest data without cycles.

```tsx
import { useDeepCompareEffect } from "react-honey-hooks";

function Results({ color, size }: { color: string; size: number }) {
  const filters = { color, size }; // a new object on every render

  useDeepCompareEffect(() => {
    void fetchResults(filters);
  }, [filters]);

  return <ResultList />;
}
```

---

### `useAsyncEffect`

```ts
function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<unknown>,
  deps?: DependencyList,
): void;
```

`useEffect` for async work. `effect` gets an `AbortSignal` that is aborted when the
dependencies change and when the component unmounts. Pass it to `fetch` to cancel the request,
and check `signal.aborted` after each `await` to skip updates from a stale run. If `effect`
fails, the error is reported like an uncaught exception (to the console and the window's
`error` event) rather than swallowed. An `AbortError`, or the signal's own abort reason, is
ignored, since it is expected after cancelling. With no `deps` it runs after every render, as
`useEffect` does. To run async work on demand and track its status, use
[`useAsync`](#useasync).

```tsx
import { useState } from "react";
import { useAsyncEffect } from "react-honey-hooks";

function Profile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useAsyncEffect(
    async (signal) => {
      const response = await fetch(`/api/users/${userId}`, { signal });
      const loaded = (await response.json()) as User;
      if (!signal.aborted) setUser(loaded);
    },
    [userId],
  );

  return user && <h1>{user.name}</h1>;
}
```

---

### `usePrefersColorScheme`

```ts
function usePrefersColorScheme(): ColorScheme;

type ColorScheme = "light" | "dark";
```

Returns the colour scheme the user's system asks for, updating when they change it. Anything
other than dark, including no preference, counts as `"light"`. It returns `"light"` during
server rendering and hydration, then the real setting.

```tsx
import { useEffect, type ReactNode } from "react";
import { usePrefersColorScheme } from "react-honey-hooks";

function ThemeRoot({ children }: { children: ReactNode }) {
  const scheme = usePrefersColorScheme();

  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
  }, [scheme]);

  return children;
}
```

---

### `usePrefersReducedMotion`

```ts
function usePrefersReducedMotion(): boolean;
```

Returns whether the user has asked their system to reduce motion
(`prefers-reduced-motion: reduce`), updating when they change the setting. It returns `false`
during server rendering and hydration, then the real setting.

```tsx
import { usePrefersReducedMotion } from "react-honey-hooks";

function Carousel({ slides }: { slides: Slide[] }) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Slider slides={slides} autoplay={!reduceMotion} transition={reduceMotion ? "none" : "slide"} />
  );
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

---

### `useIdle`

```ts
function useIdle(ms: number): boolean;
```

Returns `true` once `ms` milliseconds pass with no activity on the page, and `false` again as
soon as the user is back.

- Activity is any pointer movement or press, key press, wheel, touch or scroll (of the page or
  any element). The tab becoming visible again also counts; the tab being hidden does not, so
  a user who switched tabs goes idle as usual.
- It starts `false`, and is `false` during server rendering.
- Changing `ms` restarts the wait from `false`. A delay that isn't a positive, finite number
  never goes idle.

Frequent events such as `pointermove` only record the time, so listening is cheap.

```tsx
import { useIdle } from "react-honey-hooks";

function Presence() {
  const idle = useIdle(5 * 60_000);

  return <span>{idle ? "Away" : "Online"}</span>;
}
```

---

### `usePermission`

```ts
function usePermission(name: PermissionName | string): PermissionValue;

type PermissionValue = "granted" | "denied" | "prompt" | "pending" | "unsupported";
```

Asks the Permissions API for the state of a browser permission, such as `"geolocation"`,
`"notifications"`, `"camera"` or `"microphone"`, and re-renders when the user changes it in
the browser's settings.

- `"prompt"` means the browser will ask the user the next time the feature is used.
- It is `"pending"` while the browser answers, during server rendering and on the first render
  while hydrating.
- It is `"unsupported"` when the browser has no Permissions API or doesn't know `name`, as
  browsers support different permissions. Treat it like `"prompt"`: try the feature.
- When `name` changes it is `"pending"` again, and answers for the old name are ignored.

This hook only reads the state. To ask for a permission, use the feature itself, for example
`navigator.geolocation.getCurrentPosition`.

```tsx
import { usePermission } from "react-honey-hooks";

function LocationButton({ onLocate }: { onLocate: () => void }) {
  const permission = usePermission("geolocation");

  if (permission === "denied") {
    return <p>Location is blocked. Allow it in your browser's site settings.</p>;
  }
  return <button onClick={onLocate}>Use my location</button>;
}
```

---

### `useGeolocation`

```ts
function useGeolocation(options?: GeolocationOptions): GeolocationState;

interface GeolocationOptions {
  enabled?: boolean; // default true; false asks nothing yet
  watch?: boolean; // keep following the position, default false
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GeolocationState {
  readonly status: "idle" | "pending" | "success" | "error" | "unsupported";
  readonly position: GeolocationPosition | null;
  readonly error: GeolocationPositionError | null; // code 1 is permission denied
}
```

Gets the user's position from the browser.

- It asks as soon as it mounts, and the browser may prompt the user. To ask only when the user
  chooses, start with `enabled: false` (`"idle"`) and enable it on a click.
- With `watch`, it follows the position as it changes, until disabled or unmounted.
- `position` keeps the last known position after a later error, and when disabled.
- Changing the options asks again; `status` is `"pending"` until the new answer.
- It is `"unsupported"` without the Geolocation API, and `"pending"` during server rendering
  (`"idle"` when disabled).

Check [`usePermission("geolocation")`](#usepermission) first if you'd rather not prompt users
who already refused.

```tsx
import { useState } from "react";
import { useGeolocation } from "react-honey-hooks";

function NearbyStores() {
  const [asked, setAsked] = useState(false);
  const { status, position, error } = useGeolocation({ enabled: asked });

  if (status === "idle") {
    return (
      <button
        onClick={() => {
          setAsked(true);
        }}
      >
        Find stores near me
      </button>
    );
  }
  if (status === "error") return <p>Couldn't get your location: {error?.message}</p>;
  if (!position) return <p>Locating…</p>;
  return <StoreList near={position.coords} />;
}
```

---

### `useWakeLock`

```ts
function useWakeLock(): WakeLock;

interface WakeLock {
  readonly active: boolean; // whether the screen is being kept on now
  readonly supported: boolean;
  readonly error: Error | null; // why the last request failed
  readonly request: () => Promise<boolean>; // resolves whether it worked
  readonly release: () => Promise<void>;
}
```

Keeps the screen from dimming or locking, for example while showing a recipe, a boarding
pass or a presentation.

- Nothing happens until you call `request()`. It resolves whether the screen will stay on.
  Call it from a click or key press: some browsers, such as Safari, refuse it otherwise.
- A refusal, such as low battery or a browser policy, is reported in `error` and not retried.
- Browsers release the lock whenever the tab is hidden. It is taken again when the tab is
  visible, until you call `release()`, and it is released when the component unmounts.
- `supported` is `false` in browsers without the Screen Wake Lock API, where `request()`
  resolves `false`.

```tsx
import { useWakeLock } from "react-honey-hooks";

function RecipeSteps() {
  const { active, supported, request, release } = useWakeLock();

  if (!supported) return null;
  return (
    <label>
      <input
        type="checkbox"
        checked={active}
        onChange={() => void (active ? release() : request())}
      />
      Keep the screen on while cooking
    </label>
  );
}
```

---

### `useFullscreen`

```ts
function useFullscreen(ref: RefObject<Element | null>): Fullscreen;

interface Fullscreen {
  readonly isFullscreen: boolean; // whether this element is the one shown fullscreen
  readonly supported: boolean;
  readonly enter: () => Promise<boolean>; // resolves whether it worked
  readonly exit: () => Promise<boolean>;
  readonly toggle: () => Promise<boolean>;
}
```

Shows an element, such as a video player, slideshow or chart, fullscreen.

- Browsers only allow `enter` from a click or key press. It resolves whether it worked, and
  never rejects.
- `isFullscreen` is true only while this element is the one shown, and turns false when the
  user leaves with Escape. `exit` doesn't touch another element's fullscreen.
- `supported` is `false` without the Fullscreen API and where only videos can go fullscreen,
  as on iPhone. Hide the button then.

```tsx
import { useRef } from "react";
import { useFullscreen } from "react-honey-hooks";

function Slideshow({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isFullscreen, supported, toggle } = useFullscreen(ref);

  return (
    <div ref={ref}>
      <Slides slides={slides} />
      {supported && (
        <button onClick={() => void toggle()}>
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      )}
    </div>
  );
}
```

---

### `useIsClient`

```ts
function useIsClient(): boolean;
```

Returns `false` during server rendering and on the first render while hydrating, then `true`.
Use it to render content that only makes sense in the browser, such as something that reads
`localStorage` or the user's time zone, without the server's HTML and the first client render
disagreeing.

In an app without server rendering it is `true` from the very first render, so unlike the
common `useEffect` version it costs no extra render.

```tsx
import { useIsClient } from "react-honey-hooks";

function LocalTime({ date }: { date: Date }) {
  const isClient = useIsClient();

  // The server doesn't know the user's time zone, so it renders a placeholder.
  return <time>{isClient ? date.toLocaleTimeString() : "--:--"}</time>;
}
```

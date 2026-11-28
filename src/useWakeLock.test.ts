import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useWakeLock } from "./useWakeLock";

/** Stands in for a WakeLockSentinel: `release` fires when it is released, by us or the browser. */
class FakeSentinel extends EventTarget {
  released = false;
  readonly type = "screen";

  release(): Promise<void> {
    if (!this.released) {
      this.released = true;
      this.dispatchEvent(new Event("release"));
    }
    return Promise.resolve();
  }
}

/** jsdom has no Wake Lock API. `refuse` makes the next requests fail as a browser would. */
let sentinels: FakeSentinel[] = [];
let refuse: Error | null = null;

function installWakeLock() {
  sentinels = [];
  refuse = null;
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: {
      request: (type: string) => {
        if (type !== "screen") return Promise.reject(new TypeError("bad type"));
        if (refuse) return Promise.reject(refuse);
        const sentinel = new FakeSentinel();
        sentinels.push(sentinel);
        return Promise.resolve(sentinel);
      },
    },
  });
}

/** Hides or shows the tab; the browser releases wake locks when it is hidden. */
async function setTabVisible(visible: boolean) {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(visible ? "visible" : "hidden");
  await act(async () => {
    if (!visible) for (const sentinel of sentinels) await sentinel.release();
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
  });
}

beforeEach(() => {
  installWakeLock();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
});

describe("useWakeLock", () => {
  it("is inactive until request, then holds the lock until release", async () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current).toMatchObject({ active: false, supported: true, error: null });

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.request();
    });
    expect(granted).toBe(true);
    expect(result.current.active).toBe(true);

    await act(async () => {
      await result.current.release();
    });
    expect(result.current.active).toBe(false);
    expect(sentinels[0]?.released).toBe(true);
  });

  it("takes the lock again when the tab is visible after the browser released it", async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.request());

    await setTabVisible(false);
    expect(result.current.active).toBe(false);

    await setTabVisible(true);
    expect(result.current.active).toBe(true);
    expect(sentinels).toHaveLength(2);
  });

  it("doesn't take the lock again after the app released it", async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.request());
    await act(() => result.current.release());

    await setTabVisible(false);
    await setTabVisible(true);

    expect(result.current.active).toBe(false);
    expect(sentinels).toHaveLength(1);
  });

  it("reports a refusal in error, resolves request to false, and doesn't retry", async () => {
    refuse = new DOMException("Wake Lock permission request denied", "NotAllowedError");
    const { result } = renderHook(() => useWakeLock());

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.request();
    });
    expect(granted).toBe(false);
    expect(result.current.active).toBe(false);
    expect(result.current.error?.name).toBe("NotAllowedError");

    refuse = null;
    await setTabVisible(true);
    expect(sentinels).toHaveLength(0);
  });

  it("asks for nothing new when request is called while it holds the lock", async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.request());

    await act(() => result.current.request());

    expect(sentinels).toHaveLength(1);
  });

  it("releases the lock when it unmounts, even one granted after unmounting", async () => {
    const held = renderHook(() => useWakeLock());
    await act(() => held.result.current.request());
    held.unmount();
    expect(sentinels[0]?.released).toBe(true);

    const pending = renderHook(() => useWakeLock());
    let requested: Promise<boolean> | undefined;
    act(() => {
      requested = pending.result.current.request();
    });
    pending.unmount();
    await act(async () => {
      await requested;
    });
    expect(sentinels[1]?.released).toBe(true);
  });

  it("is unsupported without the Wake Lock API, and request resolves false", async () => {
    Reflect.deleteProperty(navigator, "wakeLock");
    const { result } = renderHook(() => useWakeLock());

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.request();
    });

    expect(result.current.supported).toBe(false);
    expect(granted).toBe(false);
    expect(result.current.active).toBe(false);
  });

  it("keeps request and release the same across renders", async () => {
    const { result, rerender } = renderHook(() => useWakeLock());
    const { request, release } = result.current;

    await act(() => request());
    rerender();

    expect(result.current.request).toBe(request);
    expect(result.current.release).toBe(release);
  });

  it("renders on the server as inactive", () => {
    function Probe() {
      return String(useWakeLock().active);
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useInfiniteScroll } from "./useInfiniteScroll";

/** Pages of numbers: page n holds n*10 .. n*10+2, and there are `pages` of them. */
function numbers(pages = 3) {
  return vi.fn((cursor: number | undefined) => {
    const page = cursor ?? 0;
    return Promise.resolve({
      items: [page * 10, page * 10 + 1, page * 10 + 2],
      next: page + 1 < pages ? page + 1 : undefined,
    });
  });
}

/**
 * jsdom has no IntersectionObserver, so this stands in for the browser API. Like the real one,
 * it reports each element's visibility soon after `observe`, and again when it changes.
 * `setVisible` changes an element's visibility as layout or scrolling would; with
 * `notify: false` the observer hasn't reported it yet, as happens just after a render.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  static visible = new Map<Element, boolean>();
  readonly elements = new Set<Element>();

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
    queueMicrotask(() => {
      if (this.elements.has(element)) this.report(element);
    });
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  report(element: Element) {
    const isIntersecting = FakeIntersectionObserver.visible.get(element) ?? false;
    const entry = { target: element, isIntersecting } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

function setVisible(element: Element, visible: boolean, { notify = true } = {}) {
  act(() => {
    FakeIntersectionObserver.visible.set(element, visible);
    if (!notify) return;
    for (const observer of FakeIntersectionObserver.instances) {
      if (observer.elements.has(element)) observer.report(element);
    }
  });
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  FakeIntersectionObserver.visible = new Map();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInfiniteScroll", () => {
  it("loads the first page on mount, then each next page on loadMore, until there are no more", async () => {
    const loadPage = numbers(2);
    const { result } = renderHook(() => useInfiniteScroll(loadPage));
    expect(result.current).toMatchObject({ items: [], status: "loading" });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current).toMatchObject({ items: [0, 1, 2], hasMore: true });
    expect(loadPage).toHaveBeenLastCalledWith(undefined, expect.any(AbortSignal));

    act(() => {
      result.current.loadMore();
    });
    expect(result.current.status).toBe("loadingMore");
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current).toMatchObject({ items: [0, 1, 2, 10, 11, 12], hasMore: false });
    expect(loadPage).toHaveBeenLastCalledWith(1, expect.any(AbortSignal));

    act(() => {
      result.current.loadMore();
    });
    expect(result.current.status).toBe("idle");
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it("keeps the items when a page fails, and loadMore tries that page again", async () => {
    let failNext = false;
    const loadPage = vi.fn((cursor: number | undefined) => {
      if (failNext) {
        failNext = false;
        return Promise.reject(new Error("offline"));
      }
      const page = cursor ?? 0;
      return Promise.resolve({ items: [page], next: page + 1 });
    });
    const { result } = renderHook(() => useInfiniteScroll(loadPage));
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    failNext = true;
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error?.message).toBe("offline");
    expect(result.current.items).toEqual([0]);

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current).toMatchObject({ items: [0, 1], error: undefined });
    expect(loadPage.mock.calls.map(([cursor]) => cursor)).toEqual([undefined, 1, 1]);
  });

  it("reload starts again from the first page, dropping the loaded items", async () => {
    const loadPage = numbers();
    const { result } = renderHook(() => useInfiniteScroll(loadPage));
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(6);
    });

    act(() => {
      result.current.reload();
    });
    expect(result.current).toMatchObject({ items: [], status: "loading" });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current.items).toEqual([0, 1, 2]);
  });

  it("aborts the load in progress and starts again when deps change, ignoring the stale result", async () => {
    const pending: { query: string; signal: AbortSignal; resolve: () => void }[] = [];
    const { result, rerender } = renderHook(
      ({ query }) =>
        useInfiniteScroll(
          (_cursor: number | undefined, signal) =>
            new Promise<{ items: string[] }>((resolve) => {
              pending.push({
                query,
                signal,
                resolve: () => {
                  resolve({ items: [query] });
                },
              });
            }),
          { deps: [query] },
        ),
      { initialProps: { query: "cats" } },
    );

    rerender({ query: "dogs" });
    expect(pending.map(({ query, signal }) => [query, signal.aborted])).toEqual([
      ["cats", true],
      ["dogs", false],
    ]);

    await act(async () => {
      pending[0]?.resolve();
      pending[1]?.resolve();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current).toMatchObject({ items: ["dogs"], hasMore: false });
  });

  it("aborts the load in progress on unmount", () => {
    const signals: AbortSignal[] = [];
    const { unmount } = renderHook(() =>
      useInfiniteScroll((_cursor, signal) => {
        signals.push(signal);
        return new Promise<{ items: number[] }>(() => undefined);
      }),
    );

    unmount();
    expect(signals[0]?.aborted).toBe(true);
  });

  it("is loading with no items on the server, where window and document don't exist", () => {
    const loadPage = numbers();
    function Probe() {
      const { status, items } = useInfiniteScroll(loadPage);
      return `${status}:${String(items.length)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("loading:0");
    expect(loadPage).not.toHaveBeenCalled();
  });

  it("loads the next page while the sentinel is in view, until there are no more", async () => {
    const sentinel = document.createElement("div");
    const loadPage = numbers(3);
    const { result } = renderHook(() =>
      useInfiniteScroll(loadPage, { sentinel: { current: sentinel }, rootMargin: "100px" }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(FakeIntersectionObserver.instances.at(-1)?.options.rootMargin).toBe("100px");
    expect(loadPage).toHaveBeenCalledTimes(1);

    // Still in view after a page loads (a short page), so it keeps loading.
    setVisible(sentinel, true);
    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
    expect(result.current.items).toHaveLength(9);
    expect(loadPage).toHaveBeenCalledTimes(3);
  });

  it("doesn't load more while the sentinel is out of view", async () => {
    const sentinel = document.createElement("div");
    const loadPage = numbers(3);
    const { result } = renderHook(() =>
      useInfiniteScroll(loadPage, { sentinel: { current: sentinel } }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    setVisible(sentinel, false);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it("doesn't load an extra page when a loaded page pushes the sentinel out of view", async () => {
    const sentinel = document.createElement("div");
    let finish = () => {};
    const loadPage = vi.fn(
      (cursor: number | undefined) =>
        new Promise<{ items: number[]; next: number }>((resolve) => {
          finish = () => {
            resolve({ items: [cursor ?? 0], next: (cursor ?? 0) + 1 });
          };
        }),
    );
    setVisible(sentinel, true);
    const { result } = renderHook(() =>
      useInfiniteScroll(loadPage, { sentinel: { current: sentinel } }),
    );
    // Let the observer report the sentinel in view while the first page loads.
    await act(async () => {
      await Promise.resolve();
    });

    // The first page fills the screen, but the observer hasn't reported that yet.
    setVisible(sentinel, false, { notify: false });
    await act(async () => {
      finish();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(result.current.status).toBe("idle");
    expect(loadPage).toHaveBeenCalledTimes(1);
  });
});

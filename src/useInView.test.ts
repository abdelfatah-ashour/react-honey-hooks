import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useInView } from "./useInView";

/**
 * jsdom has no IntersectionObserver, so this stands in for the browser API. Each observer is
 * recorded, and `intersect` reports an element entering or leaving like scrolling would.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly elements = new Set<Element>();
  disconnected = false;

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
    this.disconnected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function intersect(element: Element, isIntersecting: boolean) {
  act(() => {
    for (const observer of FakeIntersectionObserver.instances) {
      if (!observer.elements.has(element)) continue;
      const entry = { target: element, isIntersecting } as IntersectionObserverEntry;
      observer.callback([entry], observer as unknown as IntersectionObserver);
    }
  });
}

function refTo(element: Element | null): RefObject<Element | null> {
  return { current: element };
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInView", () => {
  it("is false until the element scrolls into view, then follows it in and out", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useInView(refTo(element)));
    expect(result.current).toBe(false);

    intersect(element, true);
    expect(result.current).toBe(true);

    intersect(element, false);
    expect(result.current).toBe(false);
  });

  it("with once, stays true after the first time in view and stops observing", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useInView(refTo(element), { once: true }));

    intersect(element, true);
    intersect(element, false);

    expect(result.current).toBe(true);
    expect(FakeIntersectionObserver.instances.every((o) => o.elements.size === 0)).toBe(true);
  });

  it("observes nothing while the ref holds no element", () => {
    const { result } = renderHook(() => useInView(refTo(null)));

    expect(result.current).toBe(false);
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("moves to the ref's new element after a re-render", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    const ref = refTo(first);
    const { result, rerender } = renderHook(() => useInView(ref));

    ref.current = second;
    rerender();
    intersect(first, true);
    expect(result.current).toBe(false);

    intersect(second, true);
    expect(result.current).toBe(true);
  });

  it("creates a new observer when the options change, but not for an equal inline threshold", () => {
    const element = document.createElement("div");
    const { rerender } = renderHook(
      ({ margin }) => useInView(refTo(element), { rootMargin: margin, threshold: [0, 0.5] }),
      { initialProps: { margin: "0px" } },
    );
    expect(FakeIntersectionObserver.instances).toHaveLength(1);

    rerender({ margin: "0px" });
    expect(FakeIntersectionObserver.instances).toHaveLength(1);

    rerender({ margin: "200px" });
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect(FakeIntersectionObserver.instances[0]?.disconnected).toBe(true);
    expect(FakeIntersectionObserver.instances[1]?.options).toEqual(
      expect.objectContaining({ rootMargin: "200px", threshold: [0, 0.5] }),
    );
  });

  it("disconnects when it unmounts", () => {
    const element = document.createElement("div");
    const { unmount } = renderHook(() => useInView(refTo(element)));

    unmount();

    expect(FakeIntersectionObserver.instances[0]?.disconnected).toBe(true);
  });

  it("renders on the server as not in view", () => {
    function Probe() {
      return String(useInView(refTo(null)));
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });

  it("reports the element as in view where IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const element = document.createElement("div");

    const { result } = renderHook(() => useInView(refTo(element)));

    expect(result.current).toBe(true);
  });
});

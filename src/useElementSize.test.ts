import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderToString } from "react-dom/server";
import { useElementSize } from "./useElementSize";

/**
 * jsdom has no ResizeObserver, so this stands in for the browser API. Each observer is
 * recorded, and `resize` reports a new size for an element like layout would.
 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly elements = new Map<Element, ResizeObserverOptions | undefined>();
  disconnected = false;

  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(element: Element, options?: ResizeObserverOptions) {
    this.elements.set(element, options);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
    this.disconnected = true;
  }
}

interface Box {
  width: number;
  height: number;
}

/** Reports `content` as the content box and `border` (or `content`) as the border box. */
function resize(element: Element, content: Box, border: Box = content) {
  act(() => {
    for (const observer of FakeResizeObserver.instances) {
      if (!observer.elements.has(element)) continue;
      const entry = {
        target: element,
        contentRect: { width: content.width, height: content.height },
        contentBoxSize: [{ inlineSize: content.width, blockSize: content.height }],
        borderBoxSize: [{ inlineSize: border.width, blockSize: border.height }],
      } as unknown as ResizeObserverEntry;
      observer.callback([entry], observer);
    }
  });
}

function refTo(element: Element | null): RefObject<Element | null> {
  return { current: element };
}

beforeEach(() => {
  FakeResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useElementSize", () => {
  it("is 0 × 0 until measured, then follows the element's content size", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useElementSize(refTo(element)));
    expect(result.current).toEqual({ width: 0, height: 0 });

    resize(element, { width: 120.5, height: 40 });
    expect(result.current).toEqual({ width: 120.5, height: 40 });

    resize(element, { width: 80, height: 40 });
    expect(result.current).toEqual({ width: 80, height: 40 });
  });

  it("keeps the same object while the size is unchanged", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useElementSize(refTo(element)));
    resize(element, { width: 100, height: 50 });
    const measured = result.current;

    resize(element, { width: 100, height: 50 });

    expect(result.current).toBe(measured);
  });

  it("with box: border-box, reports the size including padding and border", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => useElementSize(refTo(element), { box: "border-box" }));

    resize(element, { width: 100, height: 50 }, { width: 122, height: 72 });

    expect(result.current).toEqual({ width: 122, height: 72 });
  });

  it("with box: border-box, reports width and height for vertical text too", () => {
    const element = document.createElement("div");
    element.style.writingMode = "vertical-rl";
    document.body.append(element);
    const { result } = renderHook(() => useElementSize(refTo(element), { box: "border-box" }));

    // In vertical text the inline direction is vertical, so inlineSize is the height.
    resize(element, { width: 100, height: 50 }, { width: 72, height: 122 });

    expect(result.current).toEqual({ width: 122, height: 72 });
    element.remove();
  });

  it("measures the new element after a render that moves the ref to it", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    const ref = refTo(first);
    const { result, rerender } = renderHook(() => useElementSize(ref));

    ref.current = second;
    rerender();
    resize(second, { width: 30, height: 20 });
    expect(result.current).toEqual({ width: 30, height: 20 });

    resize(first, { width: 999, height: 999 });
    expect(result.current).toEqual({ width: 30, height: 20 });
  });

  it("keeps the last size and stops observing while the ref holds no element", () => {
    const element = document.createElement("div");
    const ref = refTo(element);
    const { result, rerender } = renderHook(() => useElementSize(ref));
    resize(element, { width: 64, height: 32 });

    ref.current = null;
    rerender();
    resize(element, { width: 1, height: 1 });

    expect(result.current).toEqual({ width: 64, height: 32 });
  });

  it("switches box when the option changes between renders", () => {
    const element = document.createElement("div");
    const { result, rerender } = renderHook(
      ({ box }: { box: "content-box" | "border-box" }) => useElementSize(refTo(element), { box }),
      { initialProps: { box: "content-box" } },
    );
    resize(element, { width: 100, height: 50 }, { width: 122, height: 72 });
    expect(result.current).toEqual({ width: 100, height: 50 });

    rerender({ box: "border-box" });
    resize(element, { width: 100, height: 50 }, { width: 122, height: 72 });

    expect(result.current).toEqual({ width: 122, height: 72 });
  });

  it("stops observing when it unmounts", () => {
    const element = document.createElement("div");
    const { unmount } = renderHook(() => useElementSize(refTo(element)));

    unmount();

    expect(FakeResizeObserver.instances.every((observer) => observer.disconnected)).toBe(true);
  });

  it("renders on the server as 0 × 0", () => {
    function Probe() {
      const { width, height } = useElementSize(refTo(null));
      return `${String(width)}x${String(height)}`;
    }

    expect(renderToString(createElement(Probe))).toBe("0x0");
  });

  it("stays 0 × 0 without throwing where ResizeObserver is missing", () => {
    vi.stubGlobal("ResizeObserver", undefined);

    const { result } = renderHook(() => useElementSize(refTo(document.createElement("div"))));

    expect(result.current).toEqual({ width: 0, height: 0 });
  });
});

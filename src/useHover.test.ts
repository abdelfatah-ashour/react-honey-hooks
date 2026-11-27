import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderToString } from "react-dom/server";
import { useHover } from "./useHover";

let element: HTMLDivElement;
let child: HTMLSpanElement;
let outside: HTMLDivElement;

beforeEach(() => {
  element = document.createElement("div");
  child = document.createElement("span");
  outside = document.createElement("div");
  element.append(child);
  document.body.append(element, outside);
});

afterEach(() => {
  element.remove();
  outside.remove();
});

function refTo(target: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: target };
}

/** Moves the pointer onto `target`, as a browser reports it: pointerover on the new target. */
function moveOnto(target: Element, pointerType = "mouse") {
  act(() => {
    target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType }));
  });
}

describe("useHover", () => {
  it("is true while the pointer is over the element or its children", () => {
    const { result } = renderHook(() => useHover(refTo(element)));
    expect(result.current).toBe(false);

    moveOnto(element);
    expect(result.current).toBe(true);

    moveOnto(child);
    expect(result.current).toBe(true);

    moveOnto(outside);
    expect(result.current).toBe(false);
  });

  it("ignores touch, so a tap can't leave it stuck on hovered", () => {
    const { result } = renderHook(() => useHover(refTo(element)));

    moveOnto(element, "touch");

    expect(result.current).toBe(false);
  });

  it("is false once the pointer leaves the window", () => {
    const { result } = renderHook(() => useHover(refTo(element)));
    moveOnto(element);

    act(() => {
      element.dispatchEvent(
        new PointerEvent("pointerout", {
          bubbles: true,
          pointerType: "mouse",
          relatedTarget: null,
        }),
      );
    });

    expect(result.current).toBe(false);
  });

  it("checks the ref's new element after the ref moves", () => {
    const ref = refTo(element);
    const { result, rerender } = renderHook(() => useHover(ref));
    moveOnto(element);

    ref.current = outside;
    rerender();
    moveOnto(outside);

    expect(result.current).toBe(true);
  });

  it("stops listening when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useHover(refTo(element)));

    unmount();

    const removed = removeListener.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["pointerover", "pointerout"]));
  });

  it("renders on the server, where document doesn't exist, as false", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
    Reflect.deleteProperty(globalThis, "document");
    function Probe() {
      return String(useHover(refTo(null)));
    }

    try {
      expect(typeof document).toBe("undefined");
      expect(renderToString(createElement(Probe))).toBe("false");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
    }
  });
});

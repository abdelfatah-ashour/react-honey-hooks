import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useScrollLock } from "./useScrollLock";

const root = document.documentElement;

/** jsdom has no layout: give the page a scrollbar `width` px wide by narrowing `<html>`. */
function setScrollbarWidth(width: number) {
  Object.defineProperty(root, "clientWidth", {
    configurable: true,
    value: window.innerWidth - width,
  });
}

beforeEach(() => {
  setScrollbarWidth(15);
});

afterEach(() => {
  root.removeAttribute("style");
  Reflect.deleteProperty(root, "clientWidth");
});

describe("useScrollLock", () => {
  it("hides the page's overflow while mounted, and restores the page's own style after", () => {
    root.style.overflow = "scroll";
    const { unmount } = renderHook(() => {
      useScrollLock();
    });
    expect(root.style.overflow).toBe("hidden");

    unmount();

    expect(root.style.overflow).toBe("scroll");
  });

  it("stays locked until the last of several locks is released", () => {
    root.style.overflow = "auto";
    const dialog = renderHook(() => {
      useScrollLock();
    });
    const nested = renderHook(() => {
      useScrollLock();
    });

    dialog.unmount();
    expect(root.style.overflow).toBe("hidden");

    nested.unmount();
    expect(root.style.overflow).toBe("auto");
  });

  it("pads the page by the scrollbar's width, on top of its own padding, and restores it", () => {
    root.style.paddingRight = "8px";
    const { unmount } = renderHook(() => {
      useScrollLock();
    });
    expect(root.style.paddingRight).toBe("23px");

    unmount();

    expect(root.style.paddingRight).toBe("8px");
  });

  it("adds no padding when the page has no scrollbar", () => {
    setScrollbarWidth(0);

    renderHook(() => {
      useScrollLock();
    });

    expect(root.style.paddingRight).toBe("");
  });

  it("locks only while locked is true, following changes between renders", () => {
    const { rerender } = renderHook(
      ({ locked }) => {
        useScrollLock(locked);
      },
      { initialProps: { locked: false } },
    );
    expect(root.style.overflow).toBe("");

    rerender({ locked: true });
    expect(root.style.overflow).toBe("hidden");

    rerender({ locked: false });
    expect(root.style.overflow).toBe("");
  });

  it("renders on the server, where document doesn't exist", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
    Reflect.deleteProperty(globalThis, "document");
    function Probe() {
      useScrollLock();
      return "ok";
    }

    try {
      expect(renderToString(createElement(Probe))).toBe("ok");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
    }
  });
});

import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useWindowSize, type WindowSize } from "./useWindowSize";

function Probe({ serverSize }: { serverSize?: WindowSize }) {
  const { width, height } = useWindowSize(serverSize);
  return `${String(width)}x${String(height)}`;
}

const original = { width: window.innerWidth, height: window.innerHeight };

/** jsdom has no real layout, so set the window's size and fire `resize` like a browser would. */
function resizeWindow(width: number, height: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
    window.dispatchEvent(new Event("resize"));
  });
}

afterEach(() => {
  resizeWindow(original.width, original.height);
});

describe("useWindowSize", () => {
  it("returns the window's inner size and follows resizes", () => {
    resizeWindow(1280, 720);
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual({ width: 1280, height: 720 });

    resizeWindow(375, 812);

    expect(result.current).toEqual({ width: 375, height: 812 });
  });

  it("keeps the same object while the size is unchanged", () => {
    resizeWindow(800, 600);
    const { result, rerender } = renderHook(() => useWindowSize());
    const first = result.current;

    rerender();
    resizeWindow(800, 600);

    expect(result.current).toBe(first);
  });

  it("stops listening for resizes when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeListener.mock.calls.map(([type]) => type)).toContain("resize");
  });

  it("renders on the server as serverSize, or 0 × 0 by default", () => {
    expect(renderToString(createElement(Probe))).toBe("0x0");
    expect(renderToString(createElement(Probe, { serverSize: { width: 1280, height: 720 } }))).toBe(
      "1280x720",
    );
  });

  it("hydrates with serverSize, then switches to the real size without a mismatch", async () => {
    resizeWindow(375, 812);
    const serverSize = { width: 1280, height: 720 };
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(Probe, { serverSize }));
    const errors = vi.spyOn(console, "error");
    const rendered: string[] = [];
    function Recorder() {
      const { width, height } = useWindowSize({ width: 1280, height: 720 });
      rendered.push(`${String(width)}x${String(height)}`);
      return `${String(width)}x${String(height)}`;
    }

    const root = await act(() => hydrateRoot(container, createElement(Recorder)));

    expect(rendered[0]).toBe("1280x720");
    expect(container.textContent).toBe("375x812");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});

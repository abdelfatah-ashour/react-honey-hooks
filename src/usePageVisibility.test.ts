import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { usePageVisibility } from "./usePageVisibility";

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
}

function changeVisibility(state: DocumentVisibilityState) {
  act(() => {
    setVisibility(state);
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("usePageVisibility", () => {
  it("returns false when the page is hidden as it mounts", () => {
    setVisibility("hidden");

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current).toBe(false);
  });

  it("updates when the page is hidden and shown again", () => {
    setVisibility("visible");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    changeVisibility("hidden");
    expect(result.current).toBe(false);

    changeVisibility("visible");
    expect(result.current).toBe(true);
  });

  it("stops listening when it unmounts", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => usePageVisibility());

    unmount();

    expect(removeListener.mock.calls.map(([type]) => type)).toContain("visibilitychange");
  });

  it("renders on the server as visible", () => {
    function Probe() {
      return String(usePageVisibility());
    }

    expect(renderToString(createElement(Probe))).toBe("true");
  });
});

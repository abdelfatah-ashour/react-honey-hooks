import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { installMatchMedia } from "./testing/installMatchMedia";
import { renderOnServer } from "./testing/renderOnServer";
import { useResponsive } from "./useResponsive";

let media: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  media = installMatchMedia();
});

/** Makes the viewport `width` wide, for the default breakpoints' queries. */
function setWidth(width: number) {
  for (const min of [0, 576, 768, 992, 1200]) {
    media.setMatches(`(min-width: ${String(min)}px)`, width >= min);
  }
}

describe("useResponsive", () => {
  it("says which of the default breakpoints the viewport has reached, and follows resizes", () => {
    setWidth(800);
    const { result } = renderHook(() => useResponsive());
    expect(result.current).toEqual({ xs: true, sm: true, md: true, lg: false, xl: false });

    act(() => {
      setWidth(1300);
    });
    expect(result.current).toEqual({ xs: true, sm: true, md: true, lg: true, xl: true });
  });

  it("takes custom breakpoints, a new object each render, and follows changes to them", () => {
    media.setMatches("(min-width: 600px)", true);
    const { result, rerender } = renderHook(({ wide }) => useResponsive({ phone: 0, wide }), {
      initialProps: { wide: 1000 },
    });
    const first = result.current;
    expect(first).toEqual({ phone: false, wide: false });

    rerender({ wide: 1000 });
    expect(result.current).toBe(first);

    rerender({ wide: 600 });
    expect(result.current).toEqual({ phone: false, wide: true });
    expect(media.listenerCount("(min-width: 1000px)")).toBe(0);
  });

  it("is all false on the server, then hydrates and shows the real breakpoints without a mismatch", async () => {
    function Probe() {
      const { md } = useResponsive();
      return md ? "wide" : "narrow";
    }
    expect(renderOnServer(createElement(Probe))).toBe("narrow");

    setWidth(800);
    const container = document.createElement("div");
    container.innerHTML = renderOnServer(createElement(Probe));
    const errors = vi.spyOn(console, "error");
    const root = await act(() => hydrateRoot(container, createElement(Probe)));

    expect(container.textContent).toBe("wide");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => useResponsive());
    expect(media.listenerCount("(min-width: 768px)")).toBe(1);

    unmount();
    expect(media.listenerCount("(min-width: 768px)")).toBe(0);
  });
});

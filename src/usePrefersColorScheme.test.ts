import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { installMatchMedia } from "./testing/installMatchMedia";
import { usePrefersColorScheme } from "./usePrefersColorScheme";

const dark = "(prefers-color-scheme: dark)";
let media: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  media = installMatchMedia();
});

describe("usePrefersColorScheme", () => {
  it("returns dark or light, following the system setting", () => {
    media.setMatches(dark, true);
    const { result } = renderHook(() => usePrefersColorScheme());
    expect(result.current).toBe("dark");

    act(() => {
      media.setMatches(dark, false);
    });
    expect(result.current).toBe("light");
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => usePrefersColorScheme());
    expect(media.listenerCount(dark)).toBe(1);

    unmount();
    expect(media.listenerCount(dark)).toBe(0);
  });

  it("renders light on the server, even when the system is dark", () => {
    media.setMatches(dark, true);
    function Theme() {
      return createElement("p", null, usePrefersColorScheme());
    }

    expect(renderOnServer(createElement(Theme))).toBe("<p>light</p>");
  });
});

import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "./testing/installMatchMedia";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const query = "(prefers-reduced-motion: reduce)";
let media: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  media = installMatchMedia();
});

describe("usePrefersReducedMotion", () => {
  it("follows the user's reduced-motion setting", () => {
    media.setMatches(query, true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);

    act(() => {
      media.setMatches(query, false);
    });
    expect(result.current).toBe(false);
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listenerCount(query)).toBe(1);

    unmount();
    expect(media.listenerCount(query)).toBe(0);
  });

  it("renders false on the server, even when the user prefers reduced motion", () => {
    media.setMatches(query, true);
    function Animation() {
      return createElement("p", null, usePrefersReducedMotion() ? "still" : "animated");
    }

    expect(renderToString(createElement(Animation))).toBe("<p>animated</p>");
  });
});

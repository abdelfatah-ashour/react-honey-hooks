import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { installMatchMedia } from "./testing/installMatchMedia";
import { useMediaQuery } from "./useMediaQuery";

let media: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  media = installMatchMedia();
});

describe("useMediaQuery", () => {
  it("returns whether the query matches when it mounts", () => {
    media.setMatches("(min-width: 768px)", true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(true);
  });

  it("updates when the query starts or stops matching", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      media.setMatches("(min-width: 768px)", true);
    });
    expect(result.current).toBe(true);

    act(() => {
      media.setMatches("(min-width: 768px)", false);
    });
    expect(result.current).toBe(false);
  });

  it("follows a new query passed on a later render", () => {
    media.setMatches("(min-width: 1024px)", true);
    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: "(min-width: 768px)" },
    });
    expect(result.current).toBe(false);

    rerender({ query: "(min-width: 1024px)" });
    expect(result.current).toBe(true);
    expect(media.listenerCount("(min-width: 768px)")).toBe(0);

    act(() => {
      media.setMatches("(min-width: 1024px)", false);
    });
    expect(result.current).toBe(false);
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(media.listenerCount("(min-width: 768px)")).toBe(1);

    unmount();

    expect(media.listenerCount("(min-width: 768px)")).toBe(0);
  });

  it("renders on the server as defaultValue, or false without one", () => {
    function Probe({ defaultValue }: { defaultValue?: boolean }) {
      return String(useMediaQuery("(min-width: 768px)", defaultValue));
    }
    media.setMatches("(min-width: 768px)", true);

    expect(renderOnServer(createElement(Probe))).toBe("false");
    expect(renderOnServer(createElement(Probe, { defaultValue: true }))).toBe("true");
  });
});

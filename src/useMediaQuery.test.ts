import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useMediaQuery } from "./useMediaQuery";

/**
 * jsdom has no `matchMedia`, so this stands in for the browser API: each query has a
 * `matches` flag the test sets, and `setMatches` fires `change` like a real resize would.
 */
function installMatchMedia() {
  const matches = new Map<string, boolean>();
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();

  window.matchMedia = (query: string) =>
    ({
      media: query,
      get matches() {
        return matches.get(query) ?? false;
      },
      addEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)?.add(listener);
      },
      removeEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
        listeners.get(query)?.delete(listener);
      },
    }) as MediaQueryList;

  return {
    setMatches(query: string, value: boolean) {
      matches.set(query, value);
      for (const listener of listeners.get(query) ?? []) {
        listener({ matches: value, media: query } as MediaQueryListEvent);
      }
    },
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
  };
}

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

    expect(renderToString(createElement(Probe))).toBe("false");
    expect(renderToString(createElement(Probe, { defaultValue: true }))).toBe("true");
  });
});

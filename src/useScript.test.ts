import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useScript } from "./useScript";

/** The script tags in the page for `src`. */
function tagsFor(src: string): HTMLScriptElement[] {
  return [...document.querySelectorAll("script")].filter(
    (script) => script.getAttribute("src") === src,
  );
}

/** jsdom doesn't load scripts, so fire the tag's `load` or `error` like a browser would. */
function finish(src: string, outcome: "load" | "error") {
  act(() => {
    tagsFor(src)[0]?.dispatchEvent(new Event(outcome));
  });
}

afterAll(() => {
  for (const script of document.querySelectorAll("script")) script.remove();
});

describe("useScript", () => {
  it("adds one async script tag, is loading until it loads, then ready", () => {
    const { result } = renderHook(() => useScript("https://cdn.example/maps.js"));

    expect(result.current).toBe("loading");
    expect(tagsFor("https://cdn.example/maps.js")).toHaveLength(1);
    expect(tagsFor("https://cdn.example/maps.js")[0]?.async).toBe(true);

    finish("https://cdn.example/maps.js", "load");

    expect(result.current).toBe("ready");
  });

  it("is error when the script fails to load", () => {
    const { result } = renderHook(() => useScript("https://cdn.example/broken.js"));

    finish("https://cdn.example/broken.js", "error");

    expect(result.current).toBe("error");
  });

  it("shares one tag and its status between components, even ones mounted later", () => {
    const first = renderHook(() => useScript("https://cdn.example/chat.js"));
    const second = renderHook(() => useScript("https://cdn.example/chat.js"));
    expect(tagsFor("https://cdn.example/chat.js")).toHaveLength(1);

    finish("https://cdn.example/chat.js", "load");
    const late = renderHook(() => useScript("https://cdn.example/chat.js"));

    expect(first.result.current).toBe("ready");
    expect(second.result.current).toBe("ready");
    expect(late.result.current).toBe("ready");
    expect(tagsFor("https://cdn.example/chat.js")).toHaveLength(1);
  });

  it("is idle and adds no tag while src is null", () => {
    const before = document.querySelectorAll("script").length;

    const { result } = renderHook(() => useScript(null));

    expect(result.current).toBe("idle");
    expect(document.querySelectorAll("script")).toHaveLength(before);
  });

  it("treats a tag the page already has for src as ready, and adds no other", () => {
    const own = document.createElement("script");
    own.src = "https://cdn.example/analytics.js";
    document.head.append(own);

    const { result } = renderHook(() => useScript("https://cdn.example/analytics.js"));

    expect(result.current).toBe("ready");
    expect(tagsFor("https://cdn.example/analytics.js")).toHaveLength(1);
  });

  it("loads the new script when src changes between renders", () => {
    const { result, rerender } = renderHook(({ src }) => useScript(src), {
      initialProps: { src: "https://cdn.example/v1.js" },
    });
    finish("https://cdn.example/v1.js", "load");

    rerender({ src: "https://cdn.example/v2.js" });
    expect(result.current).toBe("loading");
    finish("https://cdn.example/v2.js", "load");

    expect(result.current).toBe("ready");
  });

  it("leaves the tag in place when it unmounts, as removing it wouldn't unload the code", () => {
    const { unmount } = renderHook(() => useScript("https://cdn.example/widget.js"));

    unmount();

    expect(tagsFor("https://cdn.example/widget.js")).toHaveLength(1);
  });

  it("renders on the server as loading, or idle for a null src", () => {
    function Probe({ src }: { src: string | null }) {
      return useScript(src);
    }

    expect(renderOnServer(createElement(Probe, { src: "https://cdn.example/x.js" }))).toBe(
      "loading",
    );
    expect(renderOnServer(createElement(Probe, { src: null }))).toBe("idle");
  });
});

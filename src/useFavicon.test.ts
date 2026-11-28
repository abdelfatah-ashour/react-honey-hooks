import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useFavicon } from "./useFavicon";

/** The page's icon links, as `[href, type]`. */
function icons(): [string | null, string | null][] {
  return [...document.head.querySelectorAll('link[rel~="icon"]')].map((link) => [
    link.getAttribute("href"),
    link.getAttribute("type"),
  ]);
}

afterEach(() => {
  document.head.innerHTML = "";
});

describe("useFavicon", () => {
  it("adds an icon link when the page has none, and removes it on unmount", () => {
    const { unmount } = renderHook(() => {
      useFavicon("/alert.png");
    });
    expect(icons()).toEqual([["/alert.png", "image/png"]]);

    unmount();
    expect(icons()).toEqual([]);
  });

  it("updates every existing icon link, then restores them when href becomes null or on unmount", () => {
    document.head.innerHTML =
      '<link rel="icon" href="/favicon.ico" type="image/x-icon">' +
      '<link rel="shortcut icon" href="/old.ico">' +
      '<link rel="apple-touch-icon" href="/touch.png">';
    const original = icons();
    const initialProps: { href: string | null } = { href: "/unread.svg" };
    const { rerender, unmount } = renderHook(
      ({ href }) => {
        useFavicon(href);
      },
      { initialProps },
    );
    expect(icons()).toEqual([
      ["/unread.svg", "image/svg+xml"],
      ["/unread.svg", "image/svg+xml"],
    ]);
    expect(document.head.querySelector('[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(
      "/touch.png",
    );

    rerender({ href: null });
    expect(icons()).toEqual(original);

    rerender({ href: "/busy.gif" });
    expect(icons()).toEqual([
      ["/busy.gif", "image/gif"],
      ["/busy.gif", "image/gif"],
    ]);
    unmount();
    expect(icons()).toEqual(original);
  });

  it("sets the type from the extension, ignoring a query or hash, and none for an unknown one", () => {
    const { rerender } = renderHook(
      ({ href }) => {
        useFavicon(href);
      },
      { initialProps: { href: "/icon.PNG?v=2#x" } },
    );
    expect(icons()).toEqual([["/icon.PNG?v=2#x", "image/png"]]);

    for (const [href, type] of [
      ["/i.ico", "image/x-icon"],
      ["/i.jpeg", "image/jpeg"],
      ["/i.webp", "image/webp"],
      ["data:image/svg+xml,<svg></svg>", null],
      ["/icon", null],
    ] as const) {
      rerender({ href });
      expect(icons()).toEqual([[href, type]]);
    }
  });

  it("leaves the page's icon alone when href starts as null", () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
    renderHook(() => {
      useFavicon(null);
    });

    expect(icons()).toEqual([["/favicon.ico", null]]);
  });

  it("renders on the server, where window and document don't exist", () => {
    function Probe() {
      useFavicon("/icon.png");
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
  });
});

import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { installMatchMedia } from "./testing/installMatchMedia";
import { renderOnServer } from "./testing/renderOnServer";
import { useTheme } from "./useTheme";

let media: ReturnType<typeof installMatchMedia>;
const DARK = "(prefers-color-scheme: dark)";

beforeEach(() => {
  media = installMatchMedia();
  localStorage.clear();
});

describe("useTheme", () => {
  it("follows the system by default, and setMode picks light or dark instead", () => {
    media.setMatches(DARK, true);
    const { result } = renderHook(() => useTheme());
    expect(result.current).toMatchObject({ mode: "system", theme: "dark" });

    act(() => {
      result.current.setMode("light");
    });
    expect(result.current).toMatchObject({ mode: "light", theme: "light" });

    act(() => {
      result.current.setMode("system");
    });
    expect(result.current).toMatchObject({ mode: "system", theme: "dark" });

    act(() => {
      media.setMatches(DARK, false);
    });
    expect(result.current.theme).toBe("light");
  });

  it("remembers the mode under storageKey, and picks up a change made in another tab", () => {
    const { result, unmount } = renderHook(() => useTheme({ storageKey: "site-theme" }));
    act(() => {
      result.current.setMode("dark");
    });
    expect(localStorage.getItem("site-theme")).toBe('"dark"');
    unmount();

    const again = renderHook(() => useTheme({ storageKey: "site-theme" }));
    expect(again.result.current.mode).toBe("dark");

    act(() => {
      localStorage.setItem("site-theme", '"light"');
      window.dispatchEvent(new StorageEvent("storage", { key: "site-theme" }));
    });
    expect(again.result.current).toMatchObject({ mode: "light", theme: "light" });
  });

  it("treats a stored value that isn't a mode as system", () => {
    media.setMatches(DARK, true);
    for (const stored of ['"purple"', "42", "not json"]) {
      localStorage.setItem("theme", stored);
      const { result } = renderHook(() => useTheme());
      expect(result.current).toMatchObject({ mode: "system", theme: "dark" });
    }
  });

  it("keeps the same setMode, which writes under the latest storageKey", () => {
    const { result, rerender } = renderHook(({ storageKey }) => useTheme({ storageKey }), {
      initialProps: { storageKey: "old" },
    });
    const { setMode } = result.current;

    rerender({ storageKey: "new" });
    expect(result.current.setMode).toBe(setMode);
    act(() => {
      setMode("dark");
    });
    expect(localStorage.getItem("new")).toBe('"dark"');
    expect(localStorage.getItem("old")).toBeNull();
  });

  it("is system and light on the server, where window and document don't exist", () => {
    function Probe() {
      const { mode, theme } = useTheme();
      return `${mode}:${theme}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("system:light");
  });
});

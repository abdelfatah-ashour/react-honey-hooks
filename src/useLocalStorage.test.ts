import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useLocalStorage } from "./useLocalStorage";

afterEach(() => {
  localStorage.clear();
});

describe("useLocalStorage", () => {
  it("returns initialValue when nothing is stored under the key", () => {
    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    expect(result.current[0]).toBe("light");
  });

  it("returns the stored value, parsed from JSON", () => {
    localStorage.setItem("settings", JSON.stringify({ theme: "dark", fontSize: 14 }));

    const { result } = renderHook(() =>
      useLocalStorage("settings", { theme: "light", fontSize: 12 }),
    );

    expect(result.current[0]).toEqual({ theme: "dark", fontSize: 14 });
  });

  it("stores a new value as JSON and returns it", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem("count")).toBe("5");
  });

  it("passes the latest value to an updater function, even for several updates in a row", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => {
      result.current[1]((count) => count + 1);
      result.current[1]((count) => count + 1);
    });

    expect(result.current[0]).toBe(2);
  });

  it("removes the key and falls back to initialValue", () => {
    localStorage.setItem("theme", JSON.stringify("dark"));
    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("light");
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("returns initialValue when the stored text is not valid JSON", () => {
    localStorage.setItem("theme", "dark"); // written by older code without JSON.stringify

    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    expect(result.current[0]).toBe("light");
  });

  it("keeps every hook using the same key in this page in sync", () => {
    const first = renderHook(() => useLocalStorage("theme", "light"));
    const second = renderHook(() => useLocalStorage("theme", "light"));
    const other = renderHook(() => useLocalStorage("language", "en"));

    act(() => {
      first.result.current[1]("dark");
    });

    expect(second.result.current[0]).toBe("dark");
    expect(other.result.current[0]).toBe("en");
  });

  it("picks up a change made in another tab", () => {
    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    act(() => {
      localStorage.setItem("theme", JSON.stringify("dark"));
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", storageArea: localStorage }),
      );
    });
    expect(result.current[0]).toBe("dark");

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
    });
    expect(result.current[0]).toBe("light");
  });

  it("reads and writes the new key when the key changes", () => {
    localStorage.setItem("draft:1", JSON.stringify("first"));
    localStorage.setItem("draft:2", JSON.stringify("second"));
    const { result, rerender } = renderHook(
      ({ id }) => useLocalStorage(`draft:${String(id)}`, ""),
      {
        initialProps: { id: 1 },
      },
    );

    rerender({ id: 2 });
    expect(result.current[0]).toBe("second");

    act(() => {
      result.current[1]("edited");
    });
    expect(localStorage.getItem("draft:2")).toBe('"edited"');
    expect(localStorage.getItem("draft:1")).toBe('"first"');
  });

  it("keeps the same value object between renders until the stored value changes", () => {
    localStorage.setItem("settings", JSON.stringify({ theme: "dark" }));
    const { result, rerender } = renderHook(() => useLocalStorage("settings", {}));
    const first = result.current[0];

    rerender();
    expect(result.current[0]).toBe(first);

    act(() => {
      result.current[1]({ theme: "light" });
    });
    expect(result.current[0]).not.toBe(first);
  });

  it("returns initialValue when storage can't be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    expect(result.current[0]).toBe("light");
  });

  it("keeps a value in memory for this page when storage refuses the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });
    const { result } = renderHook(() => useLocalStorage("unsaved-theme", "light"));

    act(() => {
      result.current[1]("dark");
    });

    expect(result.current[0]).toBe("dark");
    expect(localStorage.getItem("unsaved-theme")).toBeNull();
  });

  it("stops listening for other tabs when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLocalStorage("theme", "light"));

    unmount();

    expect(removeListener.mock.calls.map(([type]) => type)).toContain("storage");
  });

  it("renders on the server as initialValue", () => {
    localStorage.setItem("theme", JSON.stringify("dark"));
    function Probe() {
      return useLocalStorage("theme", "light")[0];
    }

    expect(renderToString(createElement(Probe))).toBe("light");
  });
});

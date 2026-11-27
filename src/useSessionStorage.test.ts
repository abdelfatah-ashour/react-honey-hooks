import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useLocalStorage } from "./useLocalStorage";
import { useSessionStorage } from "./useSessionStorage";

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("useSessionStorage", () => {
  it("stores the value in sessionStorage, not localStorage", () => {
    const { result } = renderHook(() => useSessionStorage("step", 1));

    act(() => {
      result.current[1](2);
    });

    expect(result.current[0]).toBe(2);
    expect(sessionStorage.getItem("step")).toBe("2");
    expect(localStorage.getItem("step")).toBeNull();
  });

  it("reads sessionStorage and ignores the same key in localStorage", () => {
    localStorage.setItem("step", "9");
    sessionStorage.setItem("step", "3");

    const { result } = renderHook(() => useSessionStorage("step", 1));

    expect(result.current[0]).toBe(3);
  });

  it("returns initialValue when the key is missing or its text is not valid JSON", () => {
    const missing = renderHook(() => useSessionStorage("step", 1));
    sessionStorage.setItem("broken", "{not json");
    const broken = renderHook(() => useSessionStorage("broken", 1));

    expect(missing.result.current[0]).toBe(1);
    expect(broken.result.current[0]).toBe(1);
  });

  it("keeps hooks with the same key in sync, apart from useLocalStorage", () => {
    const first = renderHook(() => useSessionStorage("step", 1));
    const second = renderHook(() => useSessionStorage("step", 1));
    const local = renderHook(() => useLocalStorage("step", 1));

    act(() => {
      first.result.current[1]((step) => step + 1);
    });

    expect(second.result.current[0]).toBe(2);
    expect(local.result.current[0]).toBe(1);
  });

  it("removes the key and falls back to initialValue", () => {
    sessionStorage.setItem("step", "4");
    const { result } = renderHook(() => useSessionStorage("step", 1));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe(1);
    expect(sessionStorage.getItem("step")).toBeNull();
  });

  it("picks up a change written by another document in this tab", () => {
    const { result } = renderHook(() => useSessionStorage("step", 1));

    act(() => {
      sessionStorage.setItem("step", "5");
      window.dispatchEvent(
        new StorageEvent("storage", { key: "step", storageArea: sessionStorage }),
      );
    });

    expect(result.current[0]).toBe(5);
  });

  it("keeps a refused write in memory without it reaching useLocalStorage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });
    const session = renderHook(() => useSessionStorage("unsaved-step", 1));
    const local = renderHook(() => useLocalStorage("unsaved-step", 1));

    act(() => {
      session.result.current[1](7);
    });

    expect(session.result.current[0]).toBe(7);
    expect(local.result.current[0]).toBe(1);
  });

  it("stops listening for storage events when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useSessionStorage("step", 1));

    unmount();

    expect(removeListener.mock.calls.map(([type]) => type)).toContain("storage");
  });

  it("renders on the server as initialValue", () => {
    sessionStorage.setItem("step", "3");
    function Probe() {
      return String(useSessionStorage("step", 1)[0]);
    }

    expect(renderOnServer(createElement(Probe))).toBe("1");
  });
});

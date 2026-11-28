import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderOnServer } from "./testing/renderOnServer";
import { useNetwork } from "./useNetwork";

function setOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

/** Goes offline or online, as the browser reports it, at fake time `at`. */
function go(online: boolean, at: Date) {
  act(() => {
    vi.setSystemTime(at);
    setOnline(online);
    window.dispatchEvent(new Event(online ? "online" : "offline"));
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

/** A stand-in for `navigator.connection`, which only Chromium-based browsers have. */
function installConnection(details: Record<string, unknown>) {
  const connection = Object.assign(new EventTarget(), details);
  Object.defineProperty(navigator, "connection", { value: connection, configurable: true });
  return {
    change(next: Record<string, unknown>) {
      act(() => {
        Object.assign(connection, next);
        connection.dispatchEvent(new Event("change"));
      });
    },
  };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "connection");
});

describe("useNetwork", () => {
  it("says whether the browser is online, and since when it last changed", () => {
    setOnline(true);
    const { result } = renderHook(() => useNetwork());
    expect(result.current).toMatchObject({ online: true, since: null });

    const lost = new Date("2026-11-28T10:00:00Z");
    go(false, lost);
    expect(result.current).toMatchObject({ online: false, since: lost });

    const back = new Date("2026-11-28T10:05:00Z");
    go(true, back);
    expect(result.current).toMatchObject({ online: true, since: back });
  });

  it("adds the connection's details where the browser reports them, and follows changes", () => {
    setOnline(true);
    const connection = installConnection({
      effectiveType: "4g",
      downlink: 10,
      rtt: 50,
      saveData: false,
      type: "wifi",
    });
    const { result } = renderHook(() => useNetwork());
    expect(result.current).toEqual({
      online: true,
      since: null,
      effectiveType: "4g",
      downlink: 10,
      rtt: 50,
      saveData: false,
      type: "wifi",
    });

    connection.change({ effectiveType: "2g", rtt: 900 });
    expect(result.current).toMatchObject({ effectiveType: "2g", rtt: 900, since: null });
  });

  it("leaves the details undefined where the browser has no connection information", () => {
    setOnline(false);
    const { result } = renderHook(() => useNetwork());

    expect(result.current).toStrictEqual({
      online: false,
      since: null,
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
      saveData: undefined,
      type: undefined,
    });
  });

  it("returns the same object while nothing changes, and stops listening on unmount", () => {
    setOnline(true);
    const removed = vi.spyOn(window, "removeEventListener");
    const { result, rerender, unmount } = renderHook(() => useNetwork());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);

    unmount();
    const types = removed.mock.calls.map(([type]) => type);
    expect(types.filter((type) => type === "online")).toHaveLength(2);
    expect(types.filter((type) => type === "offline")).toHaveLength(2);
  });

  it("reports online on the server, then hydrates and shows the real status without a mismatch", async () => {
    function Probe() {
      return useNetwork().online ? "online" : "offline";
    }
    expect(renderOnServer(createElement(Probe))).toBe("online");

    setOnline(false);
    const container = document.createElement("div");
    container.innerHTML = renderOnServer(createElement(Probe));
    const errors = vi.spyOn(console, "error");
    const root = await act(() => hydrateRoot(container, createElement(Probe)));

    expect(container.textContent).toBe("offline");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});

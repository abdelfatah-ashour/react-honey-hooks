import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useOnlineStatus } from "./useOnlineStatus";

function setOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

describe("useOnlineStatus", () => {
  it("returns false when the browser is offline as it mounts", () => {
    setOnline(false);

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it("updates when the browser goes offline and back online", () => {
    setOnline(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("stops listening when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    const removed = removeListener.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["online", "offline"]));
  });

  it("renders on the server as online", () => {
    function Probe() {
      return String(useOnlineStatus());
    }

    expect(renderToString(createElement(Probe))).toBe("true");
  });
});

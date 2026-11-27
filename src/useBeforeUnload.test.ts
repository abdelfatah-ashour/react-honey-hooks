import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useBeforeUnload } from "./useBeforeUnload";

/** Fires `beforeunload` as the browser does when leaving, and returns whether it was cancelled. */
function leavePage(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useBeforeUnload", () => {
  it("asks the browser to warn before leaving while mounted", () => {
    renderHook(() => {
      useBeforeUnload();
    });

    expect(leavePage()).toBe(true);
  });

  it("warns only while enabled is true, following changes between renders", () => {
    const { rerender } = renderHook(
      ({ enabled }) => {
        useBeforeUnload(enabled);
      },
      { initialProps: { enabled: false } },
    );
    expect(leavePage()).toBe(false);

    rerender({ enabled: true });
    expect(leavePage()).toBe(true);

    rerender({ enabled: false });
    expect(leavePage()).toBe(false);
  });

  it("stops warning when it unmounts", () => {
    const { unmount } = renderHook(() => {
      useBeforeUnload();
    });

    unmount();

    expect(leavePage()).toBe(false);
  });

  it("renders on the server without touching window", () => {
    function Probe() {
      useBeforeUnload();
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
  });
});

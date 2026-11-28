import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useMount } from "./useMount";

describe("useMount", () => {
  it("runs once after mounting, not on later renders, even with a new function", () => {
    const first = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ fn }) => {
        useMount(fn);
      },
      { initialProps: { fn: first } },
    );
    expect(first).toHaveBeenCalledOnce();

    const second = vi.fn();
    rerender({ fn: second });
    unmount();
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
  });

  it("accepts an async function, and never treats what fn returns as a cleanup", () => {
    const errors = vi.spyOn(console, "error");
    const returned = vi.fn();
    const { unmount } = renderHook(() => {
      useMount(async () => {
        await Promise.resolve();
      });
      useMount(() => returned);
    });

    unmount();
    expect(returned).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const fn = vi.fn();
    function Probe() {
      useMount(fn);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(fn).not.toHaveBeenCalled();
  });
});

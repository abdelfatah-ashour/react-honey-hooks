import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useUnmount } from "./useUnmount";

describe("useUnmount", () => {
  it("calls the latest fn once, on unmount only", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ fn }) => {
        useUnmount(fn);
      },
      { initialProps: { fn: first } },
    );

    rerender({ fn: second });
    expect(second).not.toHaveBeenCalled();

    unmount();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("accepts an async function without React treating its promise as anything", () => {
    const errors = vi.spyOn(console, "error");
    const { unmount } = renderHook(() => {
      useUnmount(async () => {
        await Promise.resolve();
      });
    });

    unmount();
    expect(errors).not.toHaveBeenCalled();
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const fn = vi.fn();
    function Probe() {
      useUnmount(fn);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(fn).not.toHaveBeenCalled();
  });
});

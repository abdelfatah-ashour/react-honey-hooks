import { renderHook } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useUpdateEffect } from "./useUpdateEffect";

describe("useUpdateEffect", () => {
  it("skips the mount, then runs when a dependency changes", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => {
        useUpdateEffect(() => {
          effect(value);
        }, [value]);
      },
      { initialProps: { value: 1 } },
    );
    expect(effect).not.toHaveBeenCalled();

    rerender({ value: 1 });
    expect(effect).not.toHaveBeenCalled();

    rerender({ value: 2 });
    rerender({ value: 3 });
    expect(effect.mock.calls).toEqual([[2], [3]]);
  });

  it("still skips the mount in Strict Mode, which mounts, unmounts and mounts again", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => {
        useUpdateEffect(() => {
          effect(value);
        }, [value]);
      },
      { initialProps: { value: 1 }, wrapper: StrictMode },
    );
    expect(effect).not.toHaveBeenCalled();

    rerender({ value: 2 });
    expect(effect.mock.calls).toEqual([[2]]);
  });

  it("cleans up before the next run and on unmount", () => {
    const log: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ value }) => {
        useUpdateEffect(() => {
          log.push(`run ${String(value)}`);
          return () => {
            log.push(`clean ${String(value)}`);
          };
        }, [value]);
      },
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    rerender({ value: 3 });
    unmount();
    expect(log).toEqual(["run 2", "clean 2", "run 3", "clean 3"]);
  });

  it("runs after every render when given no dependencies, except the first", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => {
      useUpdateEffect(effect);
    });

    rerender();
    rerender();
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const effect = vi.fn();
    function Probe() {
      useUpdateEffect(effect, []);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(effect).not.toHaveBeenCalled();
  });
});

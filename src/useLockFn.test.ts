import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useLockFn } from "./useLockFn";

/** A promise you settle by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useLockFn", () => {
  it("ignores calls while one is running, then runs again once it finishes", async () => {
    const pending = deferred<string>();
    const fn = vi.fn((label: string) => pending.promise.then((value) => `${label}:${value}`));
    const { result } = renderHook(() => useLockFn(fn));

    const first = result.current("a");
    const ignored = result.current("b");
    expect(fn).toHaveBeenCalledOnce();
    await expect(ignored).resolves.toBeUndefined();

    pending.resolve("done");
    await expect(first).resolves.toBe("a:done");

    await expect(result.current("c")).resolves.toBe("c:done");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("passes a failure on to the caller and unlocks, whether fn rejects or throws", async () => {
    const failing = vi.fn((how: "reject" | "throw") => {
      if (how === "throw") throw new Error("thrown");
      return Promise.reject(new Error("rejected"));
    });
    const { result } = renderHook(() => useLockFn(failing));

    await expect(result.current("reject")).rejects.toThrow("rejected");
    await expect(result.current("throw")).rejects.toThrow("thrown");
    await expect(result.current("reject")).rejects.toThrow("rejected");
    expect(failing).toHaveBeenCalledTimes(3);
  });

  it("keeps one function across renders that calls the latest fn", async () => {
    const { result, rerender } = renderHook(({ fn }) => useLockFn(fn), {
      initialProps: { fn: () => Promise.resolve("first") },
    });
    const locked = result.current;

    rerender({ fn: () => Promise.resolve("second") });
    expect(result.current).toBe(locked);
    await expect(locked()).resolves.toBe("second");
  });

  it("renders on the server, where window and document don't exist", () => {
    function Probe() {
      return typeof useLockFn(() => Promise.resolve());
    }

    expect(renderOnServer(createElement(Probe))).toBe("function");
  });
});

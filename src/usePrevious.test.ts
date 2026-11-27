import { renderHook } from "@testing-library/react";
import { usePrevious } from "./usePrevious";

describe("usePrevious", () => {
  it("returns undefined on the first render, then the value from the render before", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("keeps the previous value through re-renders that pass the same value", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: "a" },
    });
    rerender({ value: "b" });
    rerender({ value: "b" });
    rerender({ value: "b" });
    expect(result.current).toBe("a");
  });

  it("treats null, undefined and NaN as ordinary values", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | null | undefined }) => usePrevious(value),
      { initialProps: { value: null as number | null | undefined } },
    );
    rerender({ value: undefined });
    expect(result.current).toBeNull();

    rerender({ value: NaN });
    expect(result.current).toBeUndefined();

    rerender({ value: NaN });
    expect(result.current).toBeUndefined();
  });

  it("compares objects by identity", () => {
    const first = { page: 1 };
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: first },
    });
    rerender({ value: { page: 1 } });
    expect(result.current).toBe(first);
  });

  it("isn't moved on early by StrictMode's double render", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
      reactStrictMode: true,
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });
});

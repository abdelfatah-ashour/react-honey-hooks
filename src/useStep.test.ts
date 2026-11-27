import { act, renderHook } from "@testing-library/react";
import { useStep } from "./useStep";

describe("useStep", () => {
  it("starts at step 0, and next and prev move between steps", () => {
    const { result } = renderHook(() => useStep(3));
    expect(result.current).toMatchObject({ step: 0, isFirst: true, isLast: false });

    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.next();
    });
    expect(result.current).toMatchObject({ step: 2, isFirst: false, isLast: true });

    act(() => {
      result.current.prev();
    });
    expect(result.current.step).toBe(1);
  });

  it("stays put at the ends: next on the last step and prev on the first", () => {
    const { result } = renderHook(() => useStep(2));

    act(() => {
      result.current.prev();
    });
    expect(result.current.step).toBe(0);

    act(() => {
      result.current.next();
      result.current.next();
      result.current.next();
    });
    expect(result.current.step).toBe(1);
  });

  it("goTo jumps to a step, keeping it in range and ignoring NaN", () => {
    const { result } = renderHook(() => useStep(4));

    act(() => {
      result.current.goTo(2);
    });
    expect(result.current.step).toBe(2);

    act(() => {
      result.current.goTo(10);
    });
    expect(result.current.step).toBe(3);

    act(() => {
      result.current.goTo(-5);
    });
    expect(result.current.step).toBe(0);

    act(() => {
      result.current.goTo(Number.NaN);
    });
    expect(result.current.step).toBe(0);
  });

  it("starts at initial, kept in range", () => {
    expect(renderHook(() => useStep(5, { initial: 3 })).result.current.step).toBe(3);
    expect(renderHook(() => useStep(5, { initial: 9 })).result.current.step).toBe(4);
    expect(renderHook(() => useStep(5, { initial: -1 })).result.current.step).toBe(0);
  });

  it("keeps the step in range when count shrinks, and steps back from there", () => {
    const { result, rerender } = renderHook(({ count }) => useStep(count), {
      initialProps: { count: 5 },
    });
    act(() => {
      result.current.goTo(4);
    });

    rerender({ count: 3 });
    expect(result.current).toMatchObject({ step: 2, isLast: true });

    act(() => {
      result.current.prev();
    });
    expect(result.current.step).toBe(1);
  });

  it.each([0, -2, Number.NaN])("with a count of %s, has a single step", (count) => {
    const { result } = renderHook(() => useStep(count));

    act(() => {
      result.current.next();
    });

    expect(result.current).toMatchObject({ step: 0, isFirst: true, isLast: true });
  });

  it("keeps next, prev and goTo the same across renders", () => {
    const { result, rerender } = renderHook(({ count }) => useStep(count), {
      initialProps: { count: 3 },
    });
    const { next, prev, goTo } = result.current;

    act(() => {
      next();
    });
    rerender({ count: 4 });

    expect(result.current.next).toBe(next);
    expect(result.current.prev).toBe(prev);
    expect(result.current.goTo).toBe(goTo);
  });
});

import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("starts at 0 and counts up and down by one", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1].inc();
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1].dec();
      result.current[1].dec();
    });
    expect(result.current[0]).toBe(-1);
  });

  it("starts at the initial value, steps by a given amount, and set and reset change it directly", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current[0]).toBe(10);

    act(() => {
      result.current[1].inc(5);
    });
    expect(result.current[0]).toBe(15);

    act(() => {
      result.current[1].dec(20);
    });
    expect(result.current[0]).toBe(-5);

    act(() => {
      result.current[1].set(3);
    });
    expect(result.current[0]).toBe(3);

    act(() => {
      result.current[1].set((current) => current * 4);
    });
    expect(result.current[0]).toBe(12);

    act(() => {
      result.current[1].reset();
    });
    expect(result.current[0]).toBe(10);
  });

  it("stays within min and max, stopping exactly at each limit", () => {
    const { result } = renderHook(() => useCounter(8, { min: 0, max: 10 }));

    act(() => {
      result.current[1].inc(2);
    });
    expect(result.current[0]).toBe(10);

    act(() => {
      result.current[1].inc();
    });
    expect(result.current[0]).toBe(10);

    act(() => {
      result.current[1].dec(25);
    });
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1].set(-3);
    });
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1].set(() => 99);
    });
    expect(result.current[0]).toBe(10);
  });

  it("clamps an initial value outside min and max, and reset returns to the clamped value", () => {
    const { result } = renderHook(() => useCounter(50, { max: 10 }));
    expect(result.current[0]).toBe(10);

    act(() => {
      result.current[1].dec(4);
    });
    act(() => {
      result.current[1].reset();
    });
    expect(result.current[0]).toBe(10);
  });

  it("keeps the count within new limits when min or max change, and uses them for later steps", () => {
    const { result, rerender } = renderHook(({ max }) => useCounter(8, { min: 0, max }), {
      initialProps: { max: 10 },
    });

    rerender({ max: 5 });
    expect(result.current[0]).toBe(5);

    act(() => {
      result.current[1].inc();
    });
    expect(result.current[0]).toBe(5);

    rerender({ max: 20 });
    act(() => {
      result.current[1].inc(10);
    });
    expect(result.current[0]).toBe(15);
  });

  it("ignores NaN, whether as a value, a delta or the initial value", () => {
    const { result } = renderHook(() => useCounter(Number.NaN));
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1].set(4);
    });
    act(() => {
      result.current[1].set(Number.NaN);
    });
    expect(result.current[0]).toBe(4);

    act(() => {
      result.current[1].inc(Number.NaN);
      result.current[1].set(() => Number.NaN);
    });
    expect(result.current[0]).toBe(4);
  });

  it("keeps the same actions object across renders, so they are safe in effect dependencies", () => {
    const { result, rerender } = renderHook(({ max }) => useCounter(0, { max }), {
      initialProps: { max: 10 },
    });
    const first = result.current[1];

    act(() => {
      first.inc();
    });
    rerender({ max: 3 });
    expect(result.current[1]).toBe(first);
  });

  it("renders on the server, where window and document don't exist, with the initial value", () => {
    function Probe() {
      const [count] = useCounter(7, { max: 5 });
      return String(count);
    }

    expect(renderOnServer(createElement(Probe))).toBe("5");
  });

  it("counts by one when inc and dec are used directly as event handlers", () => {
    const { result } = renderHook(() => useCounter());
    const plus = document.createElement("button");
    const minus = document.createElement("button");
    plus.addEventListener("click", result.current[1].inc);
    minus.addEventListener("click", result.current[1].dec);
    document.body.append(plus, minus);

    act(() => {
      plus.click();
      plus.click();
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      minus.click();
    });
    expect(result.current[0]).toBe(1);
    plus.remove();
    minus.remove();
  });
});

import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useControllableValue } from "./useControllableValue";

describe("useControllableValue", () => {
  it("holds its own value when uncontrolled, starting at defaultValue and reporting changes", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableValue({ defaultValue: "a", onChange }));
    expect(result.current[0]).toBe("a");

    act(() => {
      result.current[1]("b");
    });
    expect(result.current[0]).toBe("b");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("b");
  });

  it("shows the value prop when controlled, and only reports changes for the parent to apply", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableValue({ value, defaultValue: "ignored", onChange }),
      { initialProps: { value: "a" } },
    );
    expect(result.current[0]).toBe("a");

    act(() => {
      result.current[1]("b");
    });
    expect(result.current[0]).toBe("a");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("b");

    rerender({ value: "b" });
    expect(result.current[0]).toBe("b");
  });

  it("computes a value from the current one, chaining updates in one batch when uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableValue({ defaultValue: 1, onChange }));

    act(() => {
      result.current[1]((current) => current + 1);
      result.current[1]((current) => current * 10);
    });
    expect(result.current[0]).toBe(20);
    expect(onChange.mock.calls).toEqual([[2], [20]]);
  });

  it("computes a value from the value prop when controlled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableValue({ value: 5, onChange }));

    act(() => {
      result.current[1]((current) => current + 1);
    });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(6);
    expect(result.current[0]).toBe(5);
  });

  it("follows the value prop once it is given, and keeps the last value when it is taken away", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value?: string | undefined }) =>
        useControllableValue({ value, defaultValue: "default" }),
      { initialProps: {} },
    );
    expect(result.current[0]).toBe("default");

    rerender({ value: "controlled" });
    expect(result.current[0]).toBe("controlled");

    rerender({ value: undefined });
    expect(result.current[0]).toBe("controlled");

    act(() => {
      result.current[1]((current) => `${current ?? ""}!`);
    });
    expect(result.current[0]).toBe("controlled!");
  });

  it("calls the latest onChange and keeps the same setter across renders", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ onChange }) => useControllableValue({ defaultValue: 0, onChange }),
      { initialProps: { onChange: first } },
    );
    const setter = result.current[1];

    rerender({ onChange: second });
    act(() => {
      setter(1);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(1);
    expect(result.current[1]).toBe(setter);
  });

  it("starts undefined with no props, and reports every set, even to the same value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableValue<string>({ onChange }));
    expect(result.current[0]).toBeUndefined();

    act(() => {
      result.current[1]((current) => current ?? "first");
    });
    act(() => {
      result.current[1]("first");
    });
    expect(result.current[0]).toBe("first");
    expect(onChange.mock.calls).toEqual([["first"], ["first"]]);
  });

  it("treats null as a controlled value, unlike undefined", () => {
    const { result } = renderHook(() =>
      useControllableValue<string | null>({ value: null, defaultValue: "default" }),
    );
    expect(result.current[0]).toBeNull();
  });

  it("renders on the server, where window and document don't exist, with the right value", () => {
    function Probe({ value }: { value?: string }) {
      const [current] = useControllableValue({ value, defaultValue: "default" });
      return current;
    }

    expect(renderOnServer(createElement(Probe))).toBe("default");
    expect(renderOnServer(createElement(Probe, { value: "controlled" }))).toBe("controlled");
  });
});

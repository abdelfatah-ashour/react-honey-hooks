import { act, renderHook } from "@testing-library/react";
import { useToggle } from "./useToggle";

describe("useToggle", () => {
  it("starts false and flips with toggle", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);
  });

  it("starts from the initial value, and setTrue, setFalse and set set it directly", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].setFalse();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].setFalse();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].setTrue();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].set(false);
    });
    expect(result.current[0]).toBe(false);
  });

  it("flips once per call when toggle is called several times in one batch", () => {
    const { result } = renderHook(() => useToggle());

    act(() => {
      result.current[1].toggle();
      result.current[1].toggle();
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(true);
  });

  it("ignores the event when toggle is used directly as an event handler", () => {
    const { result } = renderHook(() => useToggle());
    const button = document.createElement("button");
    button.addEventListener("click", result.current[1].toggle);
    document.body.append(button);

    act(() => {
      button.click();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      button.click();
    });
    expect(result.current[0]).toBe(false);
    button.remove();
  });

  it("keeps the same actions object across renders", () => {
    const { result, rerender } = renderHook(() => useToggle());
    const first = result.current[1];

    act(() => {
      first.toggle();
    });
    rerender();
    expect(result.current[1]).toBe(first);
  });
});

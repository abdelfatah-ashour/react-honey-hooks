import { fireEvent, renderHook } from "@testing-library/react";
import { useClickOutside } from "./useClickOutside";

function setupDom() {
  const target = document.createElement("div");
  const child = document.createElement("span");
  const outside = document.createElement("button");
  target.append(child);
  document.body.append(target, outside);
  return { target, child, outside, ref: { current: target } };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("useClickOutside", () => {
  it("calls the handler for a click outside the element, not inside it", () => {
    const { target, child, outside, ref } = setupDom();
    const handler = vi.fn();
    renderHook(() => {
      useClickOutside(ref, handler);
    });

    fireEvent.mouseDown(target);
    fireEvent.mouseDown(child);
    expect(handler).not.toHaveBeenCalled();

    fireEvent.mouseDown(outside);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "mousedown" }));
  });

  it("calls the handler for a touch outside the element, not inside it", () => {
    const { child, outside, ref } = setupDom();
    const handler = vi.fn();
    renderHook(() => {
      useClickOutside(ref, handler);
    });

    fireEvent.touchStart(child);
    expect(handler).not.toHaveBeenCalled();

    fireEvent.touchStart(outside);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "touchstart" }));
  });

  it("always calls the handler from the latest render", () => {
    const { outside, ref } = setupDom();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => {
        useClickOutside(ref, handler);
      },
      { initialProps: { handler: first } },
    );

    rerender({ handler: second });
    fireEvent.mouseDown(outside);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops listening once unmounted", () => {
    const { outside, ref } = setupDom();
    const handler = vi.fn();
    const { unmount } = renderHook(() => {
      useClickOutside(ref, handler);
    });

    unmount();
    fireEvent.mouseDown(outside);
    fireEvent.touchStart(outside);

    expect(handler).not.toHaveBeenCalled();
  });

  it("does nothing while the ref is not attached", () => {
    const { outside } = setupDom();
    const handler = vi.fn();
    renderHook(() => {
      useClickOutside({ current: null }, handler);
    });

    fireEvent.mouseDown(outside);

    expect(handler).not.toHaveBeenCalled();
  });
});

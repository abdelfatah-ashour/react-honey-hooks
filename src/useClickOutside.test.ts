import { fireEvent, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useClickOutside, type ClickOutsideRefs } from "./useClickOutside";

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

  it("treats a press inside any of several elements as inside", () => {
    const { target, outside, ref } = setupDom();
    const popover = document.createElement("div");
    document.body.append(popover);
    const handler = vi.fn();
    const { rerender } = renderHook(() => {
      useClickOutside([ref, { current: popover }, { current: null }], handler);
    });
    rerender();

    fireEvent.mouseDown(target);
    fireEvent.mouseDown(popover);
    expect(handler).not.toHaveBeenCalled();

    fireEvent.mouseDown(outside);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("follows a ref swapped between renders", () => {
    const { target, outside, ref } = setupDom();
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ current }) => {
        useClickOutside(current, handler);
      },
      { initialProps: { current: ref as ClickOutsideRefs } },
    );

    rerender({ current: { current: outside } });
    fireEvent.mouseDown(outside);
    expect(handler).not.toHaveBeenCalled();

    fireEvent.mouseDown(target);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores presses while disabled and resumes once enabled again", () => {
    const { outside, ref } = setupDom();
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => {
        useClickOutside(ref, handler, { enabled });
      },
      { initialProps: { enabled: false } },
    );

    fireEvent.mouseDown(outside);
    fireEvent.touchStart(outside);
    expect(handler).not.toHaveBeenCalled();

    rerender({ enabled: true });
    fireEvent.mouseDown(outside);
    expect(handler).toHaveBeenCalledTimes(1);
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

  it("renders on the server without touching the document", () => {
    function Probe() {
      useClickOutside({ current: null }, () => {});
      return "ok";
    }

    expect(renderToString(createElement(Probe))).toBe("ok");
  });

  it("only accepts element refs", () => {
    expectTypeOf(useClickOutside).toBeCallableWith({ current: document.body }, () => {});
    // @ts-expect-error -- a ref to a non-element is rejected
    expectTypeOf(useClickOutside).toBeCallableWith({ current: "nope" }, () => {});
  });
});

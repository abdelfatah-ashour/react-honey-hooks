import { renderHook } from "@testing-library/react";
import { createElement, useRef, type RefObject } from "react";
import { renderToString } from "react-dom/server";
import { useEventListener } from "./useEventListener";

describe("useEventListener", () => {
  it("listens on window by default and passes the event to the handler", () => {
    const onResize = vi.fn();
    renderHook(() => {
      useEventListener("resize", onResize);
    });

    const event = new UIEvent("resize");
    window.dispatchEvent(event);

    expect(onResize).toHaveBeenCalledExactlyOnceWith(event);
  });

  it("calls the latest handler after a re-render", () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ label }) => {
        useEventListener("resize", () => {
          calls.push(label);
        });
      },
      { initialProps: { label: "first" } },
    );
    const addListener = vi.spyOn(window, "addEventListener");

    rerender({ label: "second" });
    window.dispatchEvent(new UIEvent("resize"));

    expect(calls).toEqual(["second"]);
    expect(addListener).not.toHaveBeenCalled();
  });

  it("listens only while enabled", () => {
    const onKeyDown = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => {
        useEventListener("keydown", onKeyDown, { enabled });
      },
      { initialProps: { enabled: false } },
    );

    window.dispatchEvent(new KeyboardEvent("keydown"));
    expect(onKeyDown).not.toHaveBeenCalled();

    rerender({ enabled: true });
    window.dispatchEvent(new KeyboardEvent("keydown"));
    expect(onKeyDown).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    window.dispatchEvent(new KeyboardEvent("keydown"));
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("listens on document when it is the target", () => {
    const onVisibility = vi.fn();
    renderHook(() => {
      useEventListener("visibilitychange", onVisibility, { target: document });
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(onVisibility).toHaveBeenCalledTimes(1);
  });

  it("listens on the element held by a ref, and follows the ref to a new element", () => {
    const first = document.createElement("button");
    const second = document.createElement("button");
    const ref: RefObject<HTMLElement | null> = { current: first };
    const onClick = vi.fn();
    const { rerender } = renderHook(() => {
      useEventListener("click", onClick, { target: ref });
    });

    first.click();
    window.dispatchEvent(new MouseEvent("click"));
    expect(onClick).toHaveBeenCalledTimes(1);

    ref.current = second;
    rerender();
    first.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    second.click();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does nothing while the ref holds no element", () => {
    const onClick = vi.fn();

    expect(() =>
      renderHook(() => {
        useEventListener("click", onClick, { target: useRef<HTMLElement>(null) });
      }),
    ).not.toThrow();
  });

  it("moves to the new event type when type changes", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ type }: { type: "focus" | "blur" }) => {
        useEventListener(type, handler);
      },
      { initialProps: { type: "focus" as "focus" | "blur" } },
    );

    rerender({ type: "blur" });
    window.dispatchEvent(new FocusEvent("focus"));
    window.dispatchEvent(new FocusEvent("blur"));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "blur" }));
  });

  it("calls a once listener only for the first event", () => {
    const handler = vi.fn();
    renderHook(() => {
      useEventListener("resize", handler, { once: true });
    });

    window.dispatchEvent(new UIEvent("resize"));
    window.dispatchEvent(new UIEvent("resize"));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("runs before the target's own handlers when capture is set", () => {
    const order: string[] = [];
    const button = document.createElement("button");
    document.body.append(button);
    button.addEventListener("click", (event) => {
      order.push("button");
      event.stopPropagation();
    });
    renderHook(() => {
      useEventListener(
        "click",
        () => {
          order.push("document");
        },
        { target: document, capture: true },
      );
    });

    button.click();
    button.remove();

    expect(order).toEqual(["document", "button"]);
  });

  it("stops listening when it unmounts", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => {
      useEventListener("resize", handler, { capture: true });
    });

    unmount();
    window.dispatchEvent(new UIEvent("resize"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("renders on the server without touching window", () => {
    function Probe() {
      useEventListener("resize", () => undefined);
      return "ok";
    }

    expect(renderToString(createElement(Probe))).toBe("ok");
  });

  it("types the event by target and rejects events the target doesn't have", () => {
    renderHook(() => {
      useEventListener("keydown", (event) => {
        expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
      });
      useEventListener(
        "visibilitychange",
        (event) => {
          expectTypeOf(event).toEqualTypeOf<Event>();
        },
        { target: document },
      );
      // @ts-expect-error -- "visibilitychange" is a document event, not a window one
      useEventListener("visibilitychange", () => undefined);
      // @ts-expect-error -- typo in the event name
      useEventListener("keydwon", () => undefined);
    });
  });
});

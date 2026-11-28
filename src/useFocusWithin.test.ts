import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useFocusWithin } from "./useFocusWithin";

let form: HTMLFormElement;
let field: HTMLInputElement;
let outside: HTMLButtonElement;

beforeEach(() => {
  form = document.createElement("form");
  field = document.createElement("input");
  outside = document.createElement("button");
  form.append(field);
  document.body.append(form, outside);
});

afterEach(() => {
  form.remove();
  outside.remove();
});

function refTo(element: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: element };
}

describe("useFocusWithin", () => {
  it("is true while focus is on the element or inside it, and false once it moves out", () => {
    const { result } = renderHook(() => useFocusWithin(refTo(form)));
    expect(result.current).toBe(false);

    act(() => {
      field.focus();
    });
    expect(result.current).toBe(true);

    act(() => {
      outside.focus();
    });
    expect(result.current).toBe(false);
  });

  it("is true from the first render when focus starts inside, as with autoFocus", () => {
    field.focus();
    const rendered: boolean[] = [];

    renderHook(() => {
      rendered.push(useFocusWithin(refTo(form)));
    });

    expect(rendered[0]).toBe(true);
  });

  it("is false once focus leaves for nothing, as when clicking empty space", () => {
    field.focus();
    const { result } = renderHook(() => useFocusWithin(refTo(form)));

    act(() => {
      field.blur();
    });

    expect(result.current).toBe(false);
  });

  it("checks the ref's new element after the ref moves", () => {
    const ref = refTo(form);
    act(() => {
      outside.focus();
    });
    const { result, rerender } = renderHook(() => useFocusWithin(ref));
    expect(result.current).toBe(false);

    ref.current = outside;
    rerender();

    expect(result.current).toBe(true);
  });

  it("stops listening when it unmounts", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useFocusWithin(refTo(form)));

    unmount();

    const removed = removeListener.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["focusin", "focusout"]));
  });

  it("renders on the server as false", () => {
    function Probe() {
      return String(useFocusWithin(refTo(null)));
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });
});

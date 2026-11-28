import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useFocusTrap } from "./useFocusTrap";

let opener: HTMLButtonElement;
let dialog: HTMLDivElement;
let first: HTMLInputElement;
let last: HTMLButtonElement;

beforeEach(() => {
  opener = document.createElement("button");
  opener.textContent = "Open";
  dialog = document.createElement("div");
  first = document.createElement("input");
  last = document.createElement("button");
  last.textContent = "Save";
  dialog.append(first, last);
  document.body.append(opener, dialog);
  opener.focus();
});

afterEach(() => {
  opener.remove();
  dialog.remove();
});

/** Presses Tab on the focused element; returns whether the browser's own move was cancelled. */
function pressTab(shiftKey = false): boolean {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  (document.activeElement ?? document.body).dispatchEvent(event);
  return event.defaultPrevented;
}

function refTo(element: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: element };
}

describe("useFocusTrap", () => {
  it("moves focus into the container, and back to where it was when it stops", () => {
    const { rerender } = renderHook(
      ({ active }) => {
        useFocusTrap(refTo(dialog), active);
      },
      { initialProps: { active: true } },
    );
    expect(document.activeElement).toBe(first);

    rerender({ active: false });

    expect(document.activeElement).toBe(opener);
  });

  it("wraps Tab from the last element to the first, and Shift+Tab from the first to the last", () => {
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    last.focus();
    expect(pressTab()).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(pressTab(true)).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("moves Tab between elements itself, so no browser's own rules let focus out", () => {
    const middle = document.createElement("button");
    first.after(middle);
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    first.focus();
    expect(pressTab()).toBe(true);
    expect(document.activeElement).toBe(middle);

    expect(pressTab(true)).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("treats a radio group as one stop: the checked radio, or else the first", () => {
    const radios = ["small", "large"].map((value) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "size";
      radio.value = value;
      return radio;
    });
    first.after(...radios);
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    first.focus();
    pressTab();
    expect(document.activeElement).toBe(radios[0]);
    pressTab();
    expect(document.activeElement).toBe(last);

    if (radios[1]) radios[1].checked = true;
    pressTab(true);
    expect(document.activeElement).toBe(radios[1]);
  });

  it("brings focus back inside when it moves outside, as with a click", () => {
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });
    last.focus();

    act(() => {
      opener.focus();
    });

    expect(document.activeElement).toBe(last);
  });

  it("skips disabled, hidden, inert and tabindex=-1 elements", () => {
    const disabled = document.createElement("button");
    disabled.disabled = true;
    const hidden = document.createElement("button");
    hidden.hidden = true;
    const inertGroup = document.createElement("div");
    inertGroup.setAttribute("inert", "");
    inertGroup.append(document.createElement("button"));
    const skipped = document.createElement("button");
    skipped.tabIndex = -1;
    dialog.prepend(disabled, hidden, inertGroup, skipped);
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    expect(document.activeElement).toBe(first);
    first.focus();
    pressTab(true);
    expect(document.activeElement).toBe(last);
  });

  it("focuses the container itself when nothing inside can take focus, and tidies up after", () => {
    first.remove();
    last.remove();
    const { unmount } = renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    expect(document.activeElement).toBe(dialog);
    expect(pressTab()).toBe(true);
    expect(document.activeElement).toBe(dialog);

    unmount();
    expect(dialog.hasAttribute("tabindex")).toBe(false);
  });

  it("leaves focus where it is if it is already inside, as with autoFocus", () => {
    last.focus();

    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });

    expect(document.activeElement).toBe(last);
  });

  it("with restoreFocus: false, leaves focus alone when it stops", () => {
    const { unmount } = renderHook(() => {
      useFocusTrap(refTo(dialog), true, { restoreFocus: false });
    });

    unmount();

    expect(document.activeElement).toBe(first);
  });

  it("doesn't restore focus to an element that has left the page", () => {
    const { unmount } = renderHook(() => {
      useFocusTrap(refTo(dialog));
    });
    opener.remove();

    unmount();

    expect(document.activeElement).not.toBe(opener);
  });

  it("lets focus leave freely after it unmounts", () => {
    const { unmount } = renderHook(() => {
      useFocusTrap(refTo(dialog), true, { restoreFocus: false });
    });

    unmount();
    opener.focus();

    expect(document.activeElement).toBe(opener);
  });

  it("lets the newest trap win, and hands focus back to the one below when it stops", () => {
    const confirm = document.createElement("div");
    const yes = document.createElement("button");
    const no = document.createElement("button");
    confirm.append(yes, no);
    document.body.append(confirm);
    renderHook(() => {
      useFocusTrap(refTo(dialog));
    });
    last.focus();

    const inner = renderHook(() => {
      useFocusTrap(refTo(confirm));
    });
    expect(document.activeElement).toBe(yes);
    no.focus();
    pressTab();
    expect(document.activeElement).toBe(yes);

    inner.unmount();
    expect(document.activeElement).toBe(last);
    act(() => {
      opener.focus();
    });
    expect(document.activeElement).toBe(last);
    confirm.remove();
  });

  it("renders on the server without touching the DOM", () => {
    function Probe() {
      useFocusTrap(refTo(null));
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
  });
});

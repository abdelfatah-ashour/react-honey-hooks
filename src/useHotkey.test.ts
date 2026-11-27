import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useHotkey } from "./useHotkey";

type Modifiers = Pick<KeyboardEventInit, "ctrlKey" | "metaKey" | "altKey" | "shiftKey">;

/** Presses a key with focus on `target`, letting the event bubble like a real key press. */
function press(key: string, modifiers: Modifiers = {}, target: Element = document.body) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  target.dispatchEvent(event);
  return event;
}

describe("useHotkey", () => {
  it("calls the handler when the named key is pressed", () => {
    const onEscape = vi.fn();
    renderHook(() => {
      useHotkey("Escape", onEscape);
    });

    press("Enter");
    expect(onEscape).not.toHaveBeenCalled();

    const event = press("Escape");
    expect(onEscape).toHaveBeenCalledExactlyOnceWith(event);
  });

  it("needs exactly the listed modifiers, and ignores the letter's case", () => {
    const onSave = vi.fn();
    renderHook(() => {
      useHotkey("ctrl+s", onSave);
    });

    press("s");
    press("s", { ctrlKey: true, shiftKey: true });
    press("s", { ctrlKey: true, altKey: true });
    expect(onSave).not.toHaveBeenCalled();

    press("s", { ctrlKey: true });
    press("S", { ctrlKey: true }); // Caps Lock on
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("reads mod as Cmd on Apple platforms and Ctrl elsewhere", () => {
    const onSearch = vi.fn();
    const userAgent = vi.spyOn(navigator, "userAgent", "get");
    renderHook(() => {
      useHotkey("mod+k", onSearch);
    });

    userAgent.mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15");
    press("k", { ctrlKey: true });
    expect(onSearch).not.toHaveBeenCalled();
    press("k", { metaKey: true });
    expect(onSearch).toHaveBeenCalledTimes(1);

    userAgent.mockReturnValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    press("k", { metaKey: true });
    expect(onSearch).toHaveBeenCalledTimes(1);
    press("k", { ctrlKey: true });
    expect(onSearch).toHaveBeenCalledTimes(2);
  });

  it("ignores presses while typing in a form field, unless ignoreInputs is false", () => {
    const onSlash = vi.fn();
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const fields = [
      document.createElement("input"),
      document.createElement("textarea"),
      document.createElement("select"),
      editable,
    ];
    document.body.append(...fields);
    const { rerender } = renderHook(
      ({ ignoreInputs }) => {
        useHotkey("/", onSlash, { ignoreInputs });
      },
      { initialProps: { ignoreInputs: true } },
    );

    for (const field of fields) press("/", {}, field);
    expect(onSlash).not.toHaveBeenCalled();

    rerender({ ignoreInputs: false });
    for (const field of fields) press("/", {}, field);
    expect(onSlash).toHaveBeenCalledTimes(fields.length);

    for (const field of fields) field.remove();
  });

  it("doesn't need shift listed for a symbol that is typed with shift", () => {
    const onHelp = vi.fn();
    renderHook(() => {
      useHotkey("?", onHelp);
    });

    press("?", { shiftKey: true }); // Shift + / on a US keyboard

    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it("supports the plus and space keys by name or as written", () => {
    const onZoom = vi.fn();
    const onPlay = vi.fn();
    renderHook(() => {
      useHotkey("ctrl++", onZoom);
      useHotkey("space", onPlay);
    });

    press("+", { ctrlKey: true, shiftKey: true });
    press(" ");

    expect(onZoom).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it.each(["", "ctrl+", "hyper+k", "ctrl+k+x"])("never fires for the invalid hotkey %j", (keys) => {
    const handler = vi.fn();
    renderHook(() => {
      useHotkey(keys, handler);
    });

    for (const key of ["k", "x", "+", "", "Enter"]) {
      press(key);
      press(key, { ctrlKey: true });
    }

    expect(handler).not.toHaveBeenCalled();
  });

  it("follows new keys, a new handler and enabled across renders", () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ keys, label, enabled }) => {
        useHotkey(
          keys,
          () => {
            calls.push(label);
          },
          { enabled },
        );
      },
      { initialProps: { keys: "a", label: "first", enabled: true } },
    );

    rerender({ keys: "b", label: "second", enabled: true });
    press("a");
    press("b");
    expect(calls).toEqual(["second"]);

    rerender({ keys: "b", label: "second", enabled: false });
    press("b");
    expect(calls).toEqual(["second"]);
  });

  it("stops listening when it unmounts", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => {
      useHotkey("Escape", handler);
    });

    unmount();
    press("Escape");

    expect(handler).not.toHaveBeenCalled();
  });

  it("renders on the server without touching window or navigator", () => {
    function Probe() {
      useHotkey("mod+k", () => undefined);
      return "ok";
    }

    expect(renderToString(createElement(Probe))).toBe("ok");
  });
});

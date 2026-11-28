import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useMutationObserver } from "./useMutationObserver";

let list: HTMLUListElement;

beforeEach(() => {
  list = document.createElement("ul");
  document.body.append(list);
});

afterEach(() => {
  list.remove();
});

function refTo(element: Element | null): RefObject<Element | null> {
  return { current: element };
}

/** MutationObserver reports in a microtask; let it run. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useMutationObserver", () => {
  it("calls back with the changes when children are added, anywhere inside by default", async () => {
    const onChange = vi.fn<(mutations: MutationRecord[]) => void>();
    renderHook(() => {
      useMutationObserver(refTo(list), onChange);
    });

    const item = document.createElement("li");
    list.append(item);
    item.append(document.createElement("span"));
    await flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    const records = onChange.mock.calls[0]?.[0] ?? [];
    expect(records.map((record) => record.type)).toEqual(["childList", "childList"]);
    expect(records[0]?.addedNodes[0]).toBe(item);
  });

  it("calls the latest callback, without losing changes made before a re-render", async () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ label }) => {
        useMutationObserver(refTo(list), () => {
          calls.push(label);
        });
      },
      { initialProps: { label: "first" } },
    );

    list.append(document.createElement("li"));
    rerender({ label: "second" });
    await flush();

    expect(calls).toEqual(["second"]);
  });

  it("watches what the options ask for, such as one attribute", async () => {
    const onChange = vi.fn<(mutations: MutationRecord[]) => void>();
    renderHook(() => {
      useMutationObserver(refTo(list), onChange, {
        attributes: true,
        attributeFilter: ["aria-expanded"],
      });
    });

    list.append(document.createElement("li"));
    list.setAttribute("title", "ignored");
    await flush();
    expect(onChange).not.toHaveBeenCalled();

    list.setAttribute("aria-expanded", "true");
    await flush();
    expect(onChange.mock.calls[0]?.[0][0]?.attributeName).toBe("aria-expanded");
  });

  it("doesn't drop changes when given a new options object with the same values", async () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(() => {
      useMutationObserver(refTo(list), onChange, { attributes: true });
    });

    list.setAttribute("title", "a");
    rerender();
    await flush();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("watches with the new options when they change", async () => {
    const onChange = vi.fn();
    const childrenOnly: MutationObserverInit = { childList: true };
    const { rerender } = renderHook(
      ({ options }) => {
        useMutationObserver(refTo(list), onChange, options);
      },
      { initialProps: { options: childrenOnly } },
    );

    rerender({ options: { attributes: true } });
    list.append(document.createElement("li"));
    await flush();
    expect(onChange).not.toHaveBeenCalled();

    list.setAttribute("title", "now watched");
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("watches the new element after a render that moves the ref to it", async () => {
    const other = document.createElement("ol");
    document.body.append(other);
    const ref = refTo(list);
    const onChange = vi.fn();
    const { rerender } = renderHook(() => {
      useMutationObserver(ref, onChange);
    });

    ref.current = other;
    rerender();
    list.append(document.createElement("li"));
    await flush();
    expect(onChange).not.toHaveBeenCalled();

    other.append(document.createElement("li"));
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    other.remove();
  });

  it("stops watching when it unmounts", async () => {
    const onChange = vi.fn();
    const { unmount } = renderHook(() => {
      useMutationObserver(refTo(list), onChange);
    });

    unmount();
    list.append(document.createElement("li"));
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("throws the browser's error for options that watch nothing", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => {
        useMutationObserver(refTo(list), () => undefined, { subtree: true });
      }),
    ).toThrow(TypeError);
  });

  it("renders on the server without touching the DOM", () => {
    function Probe() {
      useMutationObserver(refTo(null), () => undefined);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
  });
});

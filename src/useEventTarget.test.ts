import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useEventTarget } from "./useEventTarget";

describe("useEventTarget", () => {
  it("binds a text input: starts at initialValue, follows typing, and resets", () => {
    function Field() {
      const [value, { onChange, reset }] = useEventTarget({ initialValue: "hi" });
      return createElement(
        "div",
        null,
        createElement("input", { "aria-label": "Name", value, onChange }),
        createElement("button", { onClick: reset }, "Reset"),
      );
    }
    render(createElement(Field));
    const input = screen.getByLabelText<HTMLInputElement>("Name");
    expect(input.value).toBe("hi");

    fireEvent.change(input, { target: { value: "honey" } });
    expect(input.value).toBe("honey");

    act(() => {
      screen.getByText("Reset").click();
    });
    expect(input.value).toBe("hi");
  });

  it("reads a checkbox's checked state rather than its value", () => {
    function Agree() {
      const [checked, { onChange }] = useEventTarget({ initialValue: false });
      return createElement("input", {
        type: "checkbox",
        "aria-label": "Agree",
        value: "yes",
        checked,
        onChange,
      });
    }
    render(createElement(Agree));
    const box = screen.getByLabelText<HTMLInputElement>("Agree");

    fireEvent.click(box);
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(box.checked).toBe(false);
  });

  it("maps each new value with transform, using the latest transform", () => {
    const { result, rerender } = renderHook(
      ({ max }) =>
        useEventTarget({
          initialValue: 0,
          transform: (raw) => Math.min(Number(raw) || 0, max),
        }),
      { initialProps: { max: 10 } },
    );
    const input = document.createElement("input");

    act(() => {
      input.value = "7";
      result.current[1].onChange({ target: input });
    });
    expect(result.current[0]).toBe(7);

    rerender({ max: 5 });
    act(() => {
      input.value = "abc";
      result.current[1].onChange({ target: input });
    });
    expect(result.current[0]).toBe(0);
    act(() => {
      input.value = "9";
      result.current[1].onChange({ target: input });
    });
    expect(result.current[0]).toBe(5);
  });

  it("ignores events from elements that have no value", () => {
    const { result } = renderHook(() => useEventTarget({ initialValue: "kept" }));

    act(() => {
      result.current[1].onChange({ target: document.createElement("div") });
      result.current[1].onChange({ target: null });
    });
    expect(result.current[0]).toBe("kept");
  });

  it("keeps the same onChange and reset across renders", () => {
    const { result, rerender } = renderHook(() => useEventTarget({ initialValue: "" }));
    const actions = result.current[1];

    rerender();
    expect(result.current[1]).toBe(actions);
  });

  it("renders on the server, where window and document don't exist, with initialValue", () => {
    function Probe() {
      const [value] = useEventTarget({ initialValue: "start" });
      return value;
    }

    expect(renderOnServer(createElement(Probe))).toBe("start");
  });
});

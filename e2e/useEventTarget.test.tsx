import { useEventTarget } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Order() {
  const [name, nameField] = useEventTarget({ initialValue: "" });
  const [quantity, quantityField] = useEventTarget({
    initialValue: 1,
    transform: (value) => Math.max(1, Number(value) || 1),
  });
  const [gift, giftField] = useEventTarget({ initialValue: false });
  return (
    <>
      <input aria-label="Name" value={name} onChange={nameField.onChange} />
      <input
        aria-label="Quantity"
        type="number"
        value={quantity}
        onChange={quantityField.onChange}
      />
      <label>
        <input type="checkbox" checked={gift} onChange={giftField.onChange} />
        Gift wrap
      </label>
      <button
        type="button"
        onClick={() => {
          nameField.reset();
          quantityField.reset();
          giftField.reset();
        }}
      >
        Clear
      </button>
      <output>{JSON.stringify({ name, quantity, gift })}</output>
    </>
  );
}

describe("useEventTarget in a real browser", () => {
  it("binds a text field, a number field and a checkbox, and clears them", async () => {
    const screen = await render(<Order />);

    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.fill(screen.getByLabelText("Quantity"), "3");
    await userEvent.click(screen.getByRole("checkbox", { name: "Gift wrap" }));
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent('{"name":"Ada","quantity":3,"gift":true}');

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent('{"name":"","quantity":1,"gift":false}');
    await expect.element(screen.getByLabelText("Name")).toHaveValue("");
  });
});

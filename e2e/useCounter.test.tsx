import { useCounter } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Quantity() {
  const [quantity, { inc, dec, reset }] = useCounter(1, { min: 1, max: 3 });
  return (
    <>
      <button type="button" onClick={dec} disabled={quantity === 1}>
        Fewer
      </button>
      <output aria-label="Quantity">{quantity}</output>
      <button type="button" onClick={inc} disabled={quantity === 3}>
        More
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
    </>
  );
}

describe("useCounter in a real browser", () => {
  it("steps a quantity between its limits with clicks, and resets it", async () => {
    const screen = await render(<Quantity />);
    const quantity = screen.getByLabelText("Quantity");
    const more = screen.getByRole("button", { name: "More" });
    const fewer = screen.getByRole("button", { name: "Fewer" });
    await expect.element(quantity).toHaveTextContent("1");
    await expect.element(fewer).toBeDisabled();

    await userEvent.click(more);
    await userEvent.click(more);
    await expect.element(quantity).toHaveTextContent("3");
    await expect.element(more).toBeDisabled();

    await userEvent.click(fewer);
    await expect.element(quantity).toHaveTextContent("2");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await expect.element(quantity).toHaveTextContent("1");
  });
});

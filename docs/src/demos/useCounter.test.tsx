import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useCounter";

describe("useCounter demo", () => {
  it("keeps the quantity between 1 and 5 and resets it", async () => {
    const screen = await render(<Demo />);
    const quantity = screen.getByRole("status");
    const more = screen.getByRole("button", { name: "Add one" });
    await expect.element(quantity).toHaveTextContent("Quantity: 1");

    await userEvent.click(screen.getByRole("button", { name: "Remove one" }));
    await expect.element(quantity).toHaveTextContent("Quantity: 1");

    for (let click = 0; click < 6; click++) await userEvent.click(more);
    await expect.element(quantity).toHaveTextContent("Quantity: 5");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await expect.element(quantity).toHaveTextContent("Quantity: 1");
  });
});

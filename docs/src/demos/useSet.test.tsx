import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useSet";

describe("useSet demo", () => {
  it("toggles toppings on and off and clears them all", async () => {
    const screen = await render(<Demo />);
    const order = screen.getByRole("status");
    const cheese = screen.getByRole("checkbox", { name: "Cheese" });
    const olives = screen.getByRole("checkbox", { name: "Olives" });
    await expect.element(order).toHaveTextContent("Toppings: Cheese");
    await expect.element(cheese).toBeChecked();

    await userEvent.click(olives);
    await expect.element(order).toHaveTextContent("Toppings: Cheese, Olives");
    await userEvent.click(cheese);
    await expect.element(order).toHaveTextContent("Toppings: Olives");
    await expect.element(cheese).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await expect.element(order).toHaveTextContent("Plain pizza");
    await expect.element(olives).not.toBeChecked();
  });
});

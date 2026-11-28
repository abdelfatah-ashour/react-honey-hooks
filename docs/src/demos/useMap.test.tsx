import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useMap";

describe("useMap demo", () => {
  it("counts each fruit in the basket, removes one kind and empties it", async () => {
    const screen = await render(<Demo />);
    const basket = screen.getByRole("status");
    await expect.element(basket).toHaveTextContent("Basket is empty");

    await userEvent.click(screen.getByRole("button", { name: "Add Apples" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Pears" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Apples" }));
    await expect.element(basket).toHaveTextContent("Apples ×2, Pears ×1");

    await userEvent.click(screen.getByRole("button", { name: "Remove Apples" }));
    await expect.element(basket).toHaveTextContent("Pears ×1");

    await userEvent.click(screen.getByRole("button", { name: "Empty basket" }));
    await expect.element(basket).toHaveTextContent("Basket is empty");
  });
});

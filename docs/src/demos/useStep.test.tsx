import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useStep";

describe("useStep demo", () => {
  it("walks through the checkout steps without going past either end", async () => {
    const screen = await render(<Demo />);
    const step = screen.getByRole("status");
    const back = screen.getByRole("button", { name: "Back" });
    const next = screen.getByRole("button", { name: "Next" });
    await expect.element(step).toHaveTextContent("Step 1 of 3: Cart");
    await expect.element(back).toBeDisabled();

    await userEvent.click(next);
    await expect.element(step).toHaveTextContent("Step 2 of 3: Shipping");
    await userEvent.click(next);
    await expect.element(step).toHaveTextContent("Step 3 of 3: Payment");
    await expect.element(next).toBeDisabled();

    await userEvent.click(back);
    await expect.element(step).toHaveTextContent("Step 2 of 3: Shipping");
    await expect.element(next).toBeEnabled();
  });
});

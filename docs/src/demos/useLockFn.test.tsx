import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useLockFn";

describe("useLockFn demo", () => {
  it("places one order however often the button is clicked while placing it", async () => {
    const screen = await render(<Demo />);
    const button = screen.getByRole("button", { name: "Place order" });
    const status = screen.getByRole("status");
    await expect.element(status).toHaveTextContent("Orders placed: 0");

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await expect.element(status).toHaveTextContent("Placing order…");
    await expect.element(status, { timeout: 3000 }).toHaveTextContent("Orders placed: 1");
    // The extra clicks didn't queue more orders behind the first.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(status.element().textContent).toBe("Orders placed: 1");

    // Once the order is placed, the button works again.
    await userEvent.click(button);
    await expect.element(status, { timeout: 3000 }).toHaveTextContent("Orders placed: 2");
  });
});

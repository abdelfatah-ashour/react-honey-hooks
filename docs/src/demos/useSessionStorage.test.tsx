import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useSessionStorage";

describe("useSessionStorage demo", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("remembers the checkout step after the demo mounts again, until starting over", async () => {
    const first = await render(<Demo />);
    await expect.element(first.getByRole("status")).toHaveTextContent("Checkout step 1 of 3");

    await userEvent.click(first.getByRole("button", { name: "Continue" }));
    await expect.element(first.getByRole("status")).toHaveTextContent("Checkout step 2 of 3");
    await first.unmount();

    const second = await render(<Demo />);
    const step = second.getByRole("status");
    const next = second.getByRole("button", { name: "Continue" });
    await expect.element(step).toHaveTextContent("Checkout step 2 of 3");

    await userEvent.click(next);
    await expect.element(step).toHaveTextContent("Checkout step 3 of 3");
    await expect.element(next).toBeDisabled();

    await userEvent.click(second.getByRole("button", { name: "Start over" }));
    await expect.element(step).toHaveTextContent("Checkout step 1 of 3");
    await expect.element(next).toBeEnabled();
  });
});

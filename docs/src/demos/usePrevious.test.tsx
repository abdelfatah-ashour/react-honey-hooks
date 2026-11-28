import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./usePrevious";

describe("usePrevious demo", () => {
  it("shows no earlier price until it changes, then the price before the last change", async () => {
    const screen = await render(<Demo />);
    const price = screen.getByRole("status");
    await expect.element(price).toHaveTextContent("$20");
    await expect.element(screen.getByText("No change yet")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Raise price" }));
    await expect.element(price).toHaveTextContent("$21");
    await expect.element(screen.getByText("Was $20")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Lower price" }));
    await userEvent.click(screen.getByRole("button", { name: "Lower price" }));
    await expect.element(price).toHaveTextContent("$19");
    await expect.element(screen.getByText("Was $20")).toBeVisible();
  });
});

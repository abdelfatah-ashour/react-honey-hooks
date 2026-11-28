import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useSelections";

describe("useSelections demo", () => {
  it("selects emails one at a time or all at once, with a partly checked select-all box", async () => {
    const screen = await render(<Demo />);
    const count = screen.getByRole("status");
    const all = screen.getByRole("checkbox", { name: "Select all" });
    await expect.element(count).toHaveTextContent("Nothing selected");

    await userEvent.click(screen.getByRole("checkbox", { name: "Lunch on Friday?" }));
    await expect.element(count).toHaveTextContent("1 of 3 selected");
    await expect.element(all).toBePartiallyChecked();

    await userEvent.click(all);
    await expect.element(count).toHaveTextContent("3 of 3 selected");
    await expect.element(all).toBeChecked();
    await expect.element(screen.getByRole("checkbox", { name: "Your invoice" })).toBeChecked();

    await userEvent.click(all);
    await expect.element(count).toHaveTextContent("Nothing selected");
    await expect.element(all).not.toBeChecked();
  });
});

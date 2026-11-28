import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useClickOutside";

describe("useClickOutside demo", () => {
  it("keeps the menu open on clicks inside it and closes it on a click outside", async () => {
    const screen = await render(<Demo />);
    const menuButton = screen.getByRole("button", { name: "Menu" });

    await userEvent.click(menuButton);
    const menu = screen.getByRole("list", { name: "Menu items" });
    await expect.element(menu).toBeVisible();

    await userEvent.click(screen.getByText("Settings"));
    await expect.element(menu).toBeVisible();

    await userEvent.click(screen.getByText("Click outside the menu to close it."));
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});

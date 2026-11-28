import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useHotkey";

describe("useHotkey demo", () => {
  it("opens the shortcut list on ? while the demo has focus and closes it on Escape", async () => {
    const screen = await render(<Demo />);
    const shortcuts = screen.getByRole("list", { name: "Keyboard shortcuts" });

    screen.getByRole("group", { name: "Shortcut demo" }).element().focus();
    await userEvent.keyboard("?");
    await expect.element(shortcuts).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(shortcuts).not.toBeInTheDocument();
  });

  it("ignores ? while focus is elsewhere on the page", async () => {
    const screen = await render(
      <>
        <Demo />
        <button type="button">Elsewhere</button>
      </>,
    );
    screen.getByRole("button", { name: "Elsewhere" }).element().focus();

    await userEvent.keyboard("?");

    await expect.element(screen.getByRole("status")).toHaveTextContent("Click here, then press ?");
    expect(screen.getByRole("list", { name: "Keyboard shortcuts" }).query()).toBeNull();
  });
});

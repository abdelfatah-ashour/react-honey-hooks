import { useTheme } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function ThemePicker() {
  const { theme, mode, setMode } = useTheme({ storageKey: "e2e-theme" });
  return (
    <>
      <select
        aria-label="Theme"
        value={mode}
        onChange={(event) => {
          setMode(event.target.value as typeof mode);
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <p>Showing {theme}</p>
    </>
  );
}

afterEach(async () => {
  localStorage.removeItem("e2e-theme");
  await commands.emulateMedia({ colorScheme: null });
});

describe("useTheme in a real browser", () => {
  it("follows the system until the user picks a theme, and remembers the pick", async () => {
    await commands.emulateMedia({ colorScheme: "dark" });
    const screen = await render(<ThemePicker />);
    await expect.element(screen.getByText("Showing dark")).toBeVisible();

    await userEvent.selectOptions(screen.getByLabelText("Theme"), "light");
    await expect.element(screen.getByText("Showing light")).toBeVisible();

    await screen.unmount();
    const again = await render(<ThemePicker />);
    await expect.element(again.getByText("Showing light")).toBeVisible();

    await userEvent.selectOptions(again.getByLabelText("Theme"), "system");
    await commands.emulateMedia({ colorScheme: "light" });
    await expect.element(again.getByText("Showing light")).toBeVisible();
    await commands.emulateMedia({ colorScheme: "dark" });
    await expect.element(again.getByText("Showing dark")).toBeVisible();
  });
});

import { usePrefersColorScheme } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";

function ThemeLabel() {
  return <p>Theme: {usePrefersColorScheme()}</p>;
}

afterEach(async () => {
  await commands.emulateMedia({ colorScheme: null });
});

describe("usePrefersColorScheme in a real browser", () => {
  it("follows the system colour scheme as it changes", async () => {
    await commands.emulateMedia({ colorScheme: "light" });
    const screen = await render(<ThemeLabel />);
    await expect.element(screen.getByText("Theme: light")).toBeVisible();

    await commands.emulateMedia({ colorScheme: "dark" });
    await expect.element(screen.getByText("Theme: dark")).toBeVisible();

    await commands.emulateMedia({ colorScheme: "no-preference" });
    await expect.element(screen.getByText("Theme: light")).toBeVisible();
  });
});

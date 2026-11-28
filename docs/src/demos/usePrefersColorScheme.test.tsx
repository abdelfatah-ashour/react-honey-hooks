import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./usePrefersColorScheme";

afterEach(async () => {
  await commands.emulateMedia({ colorScheme: null });
});

describe("usePrefersColorScheme demo", () => {
  it("themes the card to follow the system colour scheme as it changes", async () => {
    await commands.emulateMedia({ colorScheme: "light" });
    const screen = await render(<Demo />);
    const scheme = screen.getByRole("status");
    await expect.element(scheme).toHaveTextContent("Light theme");

    await commands.emulateMedia({ colorScheme: "dark" });
    await expect.element(scheme).toHaveTextContent("Dark theme");

    await commands.emulateMedia({ colorScheme: "no-preference" });
    await expect.element(scheme).toHaveTextContent("Light theme");
  });
});

import { usePrefersReducedMotion } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";

function Banner() {
  return <p>{usePrefersReducedMotion() ? "Still banner" : "Animated banner"}</p>;
}

afterEach(async () => {
  await commands.emulateMedia({ reducedMotion: null });
});

describe("usePrefersReducedMotion in a real browser", () => {
  it("follows the reduced-motion setting as it changes", async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<Banner />);
    await expect.element(screen.getByText("Animated banner")).toBeVisible();

    await commands.emulateMedia({ reducedMotion: "reduce" });
    await expect.element(screen.getByText("Still banner")).toBeVisible();

    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.element(screen.getByText("Animated banner")).toBeVisible();
  });
});

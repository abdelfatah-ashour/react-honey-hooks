import { useWakeLock } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, server, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function ScreenToggle() {
  const { active, error, request, release } = useWakeLock();
  return (
    <>
      <button type="button" onClick={() => void (active ? release() : request())}>
        {active ? "Allow sleep" : "Keep screen on"}
      </button>
      <p>{active ? "Screen stays on" : "Screen may sleep"}</p>
      {error && <p role="alert">{error.name}</p>}
    </>
  );
}

describe("useWakeLock in a real browser", () => {
  // First, before the next test grants the permission: headless Chromium refuses wake locks
  // without it, even after a click, while Firefox and WebKit allow them after a click.
  it.runIf(server.browser === "chromium")("reports the browser's refusal", async () => {
    const screen = await render(<ScreenToggle />);

    await userEvent.click(screen.getByRole("button", { name: "Keep screen on" }));

    await expect.element(screen.getByRole("alert")).toHaveTextContent("NotAllowedError");
    await expect.element(screen.getByText("Screen may sleep")).toBeVisible();
  });

  it("keeps the screen on after a click, then lets it sleep", async () => {
    // Only Chromium knows this permission; asking another browser breaks its later grants.
    if (server.browser === "chromium") {
      expect(await commands.grantPermission("screen-wake-lock")).toBe(true);
    }
    const screen = await render(<ScreenToggle />);

    await userEvent.click(screen.getByRole("button", { name: "Keep screen on" }));
    await expect.element(screen.getByText("Screen stays on")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Allow sleep" }));
    await expect.element(screen.getByText("Screen may sleep")).toBeVisible();
  });
});

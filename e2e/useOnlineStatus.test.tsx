import { useOnlineStatus } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";

function ConnectionBadge() {
  return <p>{useOnlineStatus() ? "Online" : "Offline"}</p>;
}

describe("useOnlineStatus in a real browser", () => {
  it("shows the connection going offline and coming back", async () => {
    const screen = await render(<ConnectionBadge />);
    await expect.element(screen.getByText("Online")).toBeVisible();

    void commands.goOfflineFor(1500);
    await expect.element(screen.getByText("Offline")).toBeVisible();
    await expect.element(screen.getByText("Online"), { timeout: 5000 }).toBeVisible();
  });
});

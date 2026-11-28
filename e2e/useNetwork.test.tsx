import { useNetwork } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";

function ConnectionBanner() {
  const { online, since } = useNetwork();
  return (
    <>
      <p>{online ? "Online" : "Offline"}</p>
      <p data-testid="since">{since ? "Changed" : "Unchanged"}</p>
    </>
  );
}

describe("useNetwork in a real browser", () => {
  it("shows the connection dropping and coming back, and notes that it changed", async () => {
    const screen = await render(<ConnectionBanner />);
    await expect.element(screen.getByText("Online")).toBeVisible();
    await expect.element(screen.getByTestId("since")).toHaveTextContent("Unchanged");

    void commands.goOfflineFor(1500);
    await expect.element(screen.getByText("Offline")).toBeVisible();
    await expect.element(screen.getByTestId("since")).toHaveTextContent("Changed");
    await expect.element(screen.getByText("Online"), { timeout: 5000 }).toBeVisible();
  });
});
